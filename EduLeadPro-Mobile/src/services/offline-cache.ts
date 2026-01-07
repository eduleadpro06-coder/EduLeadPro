/**
 * Offline Cache Service
 * SQLite-based local storage for offline-first functionality
 */

import * as SQLite from 'expo-sqlite';
import type { Child, DailyUpdate, Attendance, Announcement, Event } from '../../services/api';

const DB_NAME = 'eduleadpro_cache.db';

class OfflineCacheService {
    private db: SQLite.SQLiteDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize database and create tables
     */
    async init(): Promise<void> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                this.db = await SQLite.openDatabaseAsync(DB_NAME);
                await this.createTables();
                console.log('[Cache] Database initialized');
            } catch (error) {
                console.error('[Cache] Init error:', error);
                this.initPromise = null; // Allow retry on failure
                throw error;
            }
        })();

        return this.initPromise;
    }

    private async ensureInitialized() {
        if (!this.db) {
            if (this.initPromise) {
                await this.initPromise;
            } else {
                await this.init();
            }
        }
        if (!this.db) throw new Error('Database not initialized');
    }

    /**
     * Create all cache tables
     */
    private async createTables(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized'); // Called internally by init, so keep check or assume called by init


        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS cached_children (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                class TEXT,
                email TEXT,
                parent_name TEXT,
                phone TEXT,
                status TEXT,
                cached_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cached_attendance (
                id INTEGER PRIMARY KEY,
                child_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                status TEXT NOT NULL,
                check_in_time TEXT,
                check_out_time TEXT,
                cached_at INTEGER NOT NULL,
                UNIQUE(child_id, date)
            );

            CREATE TABLE IF NOT EXISTS cached_activities (
                id INTEGER PRIMARY KEY,
                child_id INTEGER NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                activity_type TEXT,
                mood TEXT,
                teacher_name TEXT,
                media_urls TEXT,
                posted_at TEXT NOT NULL,
                cached_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cached_announcements (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                priority TEXT,
                published_at TEXT NOT NULL,
                cached_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cached_events (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                event_date TEXT NOT NULL,
                event_time TEXT,
                event_type TEXT,
                cached_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS pending_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                retry_count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS cache_metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );
        `);
    }

    /**
     * Cache children data
     */
    async cacheChildren(children: Child[]): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        // Clear existing children
        await this.db.runAsync('DELETE FROM cached_children');

        // Insert new children
        for (const child of children) {
            await this.db.runAsync(
                `INSERT INTO cached_children (id, name, class, email, parent_name, phone, status, cached_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [child.id, child.name, child.class, child.email, child.parentName, child.phone, child.status, Date.now()]
            );
        }

        // Update metadata
        await this.db.runAsync(
            `INSERT OR REPLACE INTO cache_metadata (key, value, updated_at) VALUES (?, ?, ?)`,
            ['last_children_sync', new Date().toISOString(), Date.now()]
        );
    }

    /**
     * Get cached children
     */
    async getCachedChildren(): Promise<Child[]> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        const rows = await this.db.getAllAsync<any>('SELECT * FROM cached_children');
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            class: row.class,
            email: row.email,
            parentName: row.parent_name,
            phone: row.phone,
            status: row.status
        }));
    }

    /**
     * Cache attendance for a child
     */
    async cacheAttendance(childId: number, attendance: Attendance[]): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        for (const record of attendance) {
            await this.db.runAsync(
                `INSERT OR REPLACE INTO cached_attendance 
                 (id, child_id, date, status, check_in_time, check_out_time, cached_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [record.id, childId, record.date, record.status, record.checkInTime || null, record.checkOutTime || null, Date.now()]
            );
        }
    }

    /**
     * Get cached attendance for a child
     */
    async getCachedAttendance(childId: number, days: number = 30): Promise<Attendance[]> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        const rows = await this.db.getAllAsync<any>(
            `SELECT * FROM cached_attendance 
             WHERE child_id = ? AND date >= ?
             ORDER BY date DESC`,
            [childId, cutoffStr]
        );

        return rows.map(row => ({
            id: row.id,
            date: row.date,
            status: row.status,
            checkInTime: row.check_in_time,
            checkOutTime: row.check_out_time
        }));
    }

    /**
     * Cache daily updates/activities
     */
    async cacheActivities(childId: number, activities: DailyUpdate[]): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        for (const activity of activities) {
            await this.db.runAsync(
                `INSERT OR REPLACE INTO cached_activities 
                 (id, child_id, title, content, activity_type, mood, teacher_name, media_urls, posted_at, cached_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    activity.id,
                    childId,
                    activity.title,
                    activity.content,
                    activity.activityType,
                    activity.mood,
                    activity.teacherName,
                    JSON.stringify(activity.mediaUrls),
                    activity.postedAt,
                    Date.now()
                ]
            );
        }
    }

    /**
     * Get cached activities for a child
     */
    async getCachedActivities(childId: number, limit: number = 20): Promise<DailyUpdate[]> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        const rows = await this.db.getAllAsync<any>(
            `SELECT * FROM cached_activities 
             WHERE child_id = ?
             ORDER BY posted_at DESC
             LIMIT ?`,
            [childId, limit]
        );

        return rows.map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            activityType: row.activity_type,
            mood: row.mood,
            teacherName: row.teacher_name,
            mediaUrls: JSON.parse(row.media_urls || '[]'),
            postedAt: row.posted_at
        }));
    }

    /**
     * Cache announcements
     */
    async cacheAnnouncements(announcements: Announcement[]): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync('DELETE FROM cached_announcements');

        for (const announcement of announcements) {
            await this.db.runAsync(
                `INSERT INTO cached_announcements (id, title, content, priority, published_at, cached_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [announcement.id, announcement.title, announcement.content, announcement.priority, announcement.publishedAt, Date.now()]
            );
        }
    }

    /**
     * Get cached announcements
     */
    async getCachedAnnouncements(): Promise<Announcement[]> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        const rows = await this.db.getAllAsync<any>(
            'SELECT * FROM cached_announcements ORDER BY published_at DESC'
        );

        return rows.map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            priority: row.priority,
            publishedAt: row.published_at
        }));
    }

    /**
     * Cache events
     */
    async cacheEvents(events: Event[]): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync('DELETE FROM cached_events');

        for (const event of events) {
            await this.db.runAsync(
                `INSERT INTO cached_events (id, title, description, event_date, event_time, event_type, cached_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [event.id, event.title, event.description || null, event.eventDate, event.eventTime || null, event.eventType || null, Date.now()]
            );
        }
    }

    /**
     * Get cached events
     */
    async getCachedEvents(): Promise<Event[]> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        const rows = await this.db.getAllAsync<any>(
            'SELECT * FROM cached_events ORDER BY event_date ASC'
        );

        return rows.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            eventDate: row.event_date,
            eventTime: row.event_time,
            eventType: row.event_type
        }));
    }

    /**
     * Queue an action for later execution (when online)
     */
    async queueAction(actionType: string, payload: any): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync(
            `INSERT INTO pending_actions (action_type, payload, created_at)
             VALUES (?, ?, ?)`,
            [actionType, JSON.stringify(payload), Date.now()]
        );
        console.log(`[Cache] Queued action: ${actionType}`);
    }

    /**
     * Get all pending actions
     */
    async getPendingActions(): Promise<Array<{ id: number; actionType: string; payload: any }>> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        const rows = await this.db.getAllAsync<any>(
            'SELECT * FROM pending_actions ORDER BY created_at ASC'
        );

        return rows.map(row => ({
            id: row.id,
            actionType: row.action_type,
            payload: JSON.parse(row.payload)
        }));
    }

    /**
     * Remove a pending action after successful sync
     */
    async removePendingAction(id: number): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');
        await this.db.runAsync('DELETE FROM pending_actions WHERE id = ?', [id]);
    }

    /**
     * Get last sync time for a data type
     */
    async getLastSyncTime(key: string): Promise<Date | null> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        const row = await this.db.getFirstAsync<any>(
            'SELECT value FROM cache_metadata WHERE key = ?',
            [key]
        );

        if (row) {
            return new Date(row.value);
        }
        return null;
    }

    /**
     * Clear old cache data (older than 30 days)
     */
    async clearOldCache(): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        await this.db.runAsync('DELETE FROM cached_attendance WHERE cached_at < ?', [thirtyDaysAgo]);
        await this.db.runAsync('DELETE FROM cached_activities WHERE cached_at < ?', [thirtyDaysAgo]);
        console.log('[Cache] Cleared old cache data');
    }

    /**
     * Clear all cache (for logout)
     */
    async clearAllCache(): Promise<void> {
        await this.ensureInitialized();
        if (!this.db) throw new Error('Database not initialized');

        await this.db.runAsync('DELETE FROM cached_children');
        await this.db.runAsync('DELETE FROM cached_attendance');
        await this.db.runAsync('DELETE FROM cached_activities');
        await this.db.runAsync('DELETE FROM cached_announcements');
        await this.db.runAsync('DELETE FROM cached_events');
        await this.db.runAsync('DELETE FROM cache_metadata');
        console.log('[Cache] Cleared all cache');
    }
}

export const offlineCache = new OfflineCacheService();


