/**
 * Offline Cache Service
 * SQLite-based local storage for offline-first functionality
 */

import * as SQLite from 'expo-sqlite';
import type { Child, DailyUpdate, Attendance, Announcement, Event } from '../api';

const DB_NAME = 'eduleadpro_cache.db';

class OfflineCacheService {
    private db: SQLite.WebSQLDatabase | null = null;

    /**
     * Initialize database and create tables
     */
    async init(): Promise<void> {
        try {
            this.db = SQLite.openDatabase(DB_NAME);
            await this.createTables();
            console.log('[Cache] Database initialized');
        } catch (error) {
            console.error('[Cache] Init error:', error);
        }
    }

    /**
     * Create all cache tables
     */
    private createTables(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('Database not initialized');

            this.db.transaction(tx => {
                // Children cache
                tx.executeSql(`
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
        `);

                // Attendance cache
                tx.executeSql(`
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
        `);

                // Daily updates cache
                tx.executeSql(`
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
        `);

                // Announcements cache
                tx.executeSql(`
          CREATE TABLE IF NOT EXISTS cached_announcements (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            priority TEXT,
            published_at TEXT NOT NULL,
            cached_at INTEGER NOT NULL
          );
        `);

                // Events cache
                tx.executeSql(`
          CREATE TABLE IF NOT EXISTS cached_events (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            event_date TEXT NOT NULL,
            event_time TEXT,
            event_type TEXT,
            cached_at INTEGER NOT NULL
          );
        `);

                // Pending actions queue (for offline operations)
                tx.executeSql(`
          CREATE TABLE IF NOT EXISTS pending_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_type TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            retry_count INTEGER DEFAULT 0
          );
        `);

                // Metadata table for sync tracking
                tx.executeSql(`
          CREATE TABLE IF NOT EXISTS cache_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          );
        `);

            }, reject, () => resolve());
        });
    }

    /**
     * Cache children data
     */
    async cacheChildren(children: Child[]): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                // Clear existing children
                tx.executeSql('DELETE FROM cached_children');

                // Insert new children
                children.forEach(child => {
                    tx.executeSql(
                        `INSERT INTO cached_children (id, name, class, email, parent_name, phone, status, cached_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [child.id, child.name, child.class, child.email, child.parentName, child.phone, child.status, Date.now()]
                    );
                });

                // Update metadata
                tx.executeSql(
                    `INSERT OR REPLACE INTO cache_metadata (key, value, updated_at) VALUES (?, ?, ?)`,
                    ['last_children_sync', new Date().toISOString(), Date.now()]
                );
            }, reject, () => resolve());
        });
    }

    /**
     * Get cached children
     */
    async getCachedChildren(): Promise<Child[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql(
                    'SELECT * FROM cached_children',
                    [],
                    (_, { rows }) => {
                        const children: Child[] = [];
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows.item(i);
                            children.push({
                                id: row.id,
                                name: row.name,
                                class: row.class,
                                email: row.email,
                                parentName: row.parent_name,
                                phone: row.phone,
                                status: row.status
                            });
                        }
                        resolve(children);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    /**
     * Cache attendance for a child
     */
    async cacheAttendance(childId: number, attendance: Attendance[]): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                attendance.forEach(record => {
                    tx.executeSql(
                        `INSERT OR REPLACE INTO cached_attendance 
             (id, child_id, date, status, check_in_time, check_out_time, cached_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [record.id, childId, record.date, record.status, record.checkInTime || null, record.checkOutTime || null, Date.now()]
                    );
                });
            }, reject, () => resolve());
        });
    }

    /**
     * Get cached attendance for a child
     */
    async getCachedAttendance(childId: number, days: number = 30): Promise<Attendance[]> {
        if (!this.db) throw new Error('Database not initialized');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql(
                    `SELECT * FROM cached_attendance 
           WHERE child_id = ? AND date >= ?
           ORDER BY date DESC`,
                    [childId, cutoffStr],
                    (_, { rows }) => {
                        const attendance: Attendance[] = [];
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows.item(i);
                            attendance.push({
                                id: row.id,
                                date: row.date,
                                status: row.status,
                                checkInTime: row.check_in_time,
                                checkOutTime: row.check_out_time
                            });
                        }
                        resolve(attendance);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    /**
     * Cache daily updates/activities
     */
    async cacheActivities(childId: number, activities: DailyUpdate[]): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                activities.forEach(activity => {
                    tx.executeSql(
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
                });
            }, reject, () => resolve());
        });
    }

    /**
     * Get cached activities for a child
     */
    async getCachedActivities(childId: number, limit: number = 20): Promise<DailyUpdate[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql(
                    `SELECT * FROM cached_activities 
           WHERE child_id = ?
           ORDER BY posted_at DESC
           LIMIT ?`,
                    [childId, limit],
                    (_, { rows }) => {
                        const activities: DailyUpdate[] = [];
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows.item(i);
                            activities.push({
                                id: row.id,
                                title: row.title,
                                content: row.content,
                                activityType: row.activity_type,
                                mood: row.mood,
                                teacherName: row.teacher_name,
                                mediaUrls: JSON.parse(row.media_urls || '[]'),
                                postedAt: row.posted_at
                            });
                        }
                        resolve(activities);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    /**
     * Cache announcements
     */
    async cacheAnnouncements(announcements: Announcement[]): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                // Clear old announcements
                tx.executeSql('DELETE FROM cached_announcements');

                announcements.forEach(announcement => {
                    tx.executeSql(
                        `INSERT INTO cached_announcements (id, title, content, priority, published_at, cached_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
                        [announcement.id, announcement.title, announcement.content, announcement.priority, announcement.publishedAt, Date.now()]
                    );
                });
            }, reject, () => resolve());
        });
    }

    /**
     * Get cached announcements
     */
    async getCachedAnnouncements(): Promise<Announcement[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql(
                    'SELECT * FROM cached_announcements ORDER BY published_at DESC',
                    [],
                    (_, { rows }) => {
                        const announcements: Announcement[] = [];
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows.item(i);
                            announcements.push({
                                id: row.id,
                                title: row.title,
                                content: row.content,
                                priority: row.priority,
                                publishedAt: row.published_at
                            });
                        }
                        resolve(announcements);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    /**
     * Cache events
     */
    async cacheEvents(events: Event[]): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                // Clear old events
                tx.executeSql('DELETE FROM cached_events');

                events.forEach(event => {
                    tx.executeSql(
                        `INSERT INTO cached_events (id, title, description, event_date, event_time, event_type, cached_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [event.id, event.title, event.description, event.eventDate, event.eventTime, event.eventType, Date.now()]
                    );
                });
            }, reject, () => resolve());
        });
    }

    /**
     * Get cached events
     */
    async getCachedEvents(): Promise<Event[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql(
                    'SELECT * FROM cached_events ORDER BY event_date ASC',
                    [],
                    (_, { rows }) => {
                        const events: Event[] = [];
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows.item(i);
                            events.push({
                                id: row.id,
                                title: row.title,
                                description: row.description,
                                eventDate: row.event_date,
                                eventTime: row.event_time,
                                eventType: row.event_type
                            });
                        }
                        resolve(events);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    /**
     * Queue an action for later execution (when online)
     */
    async queueAction(actionType: string, payload: any): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql(
                    `INSERT INTO pending_actions (action_type, payload, created_at)
           VALUES (?, ?, ?)`,
                    [actionType, JSON.stringify(payload), Date.now()]
                );
            }, reject, () => {
                console.log(`[Cache] Queued action: ${actionType}`);
                resolve();
            });
        });
    }

    /**
     * Get all pending actions
     */
    async getPendingActions(): Promise<Array<{ id: number; actionType: string; payload: any }>> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql(
                    'SELECT * FROM pending_actions ORDER BY created_at ASC',
                    [],
                    (_, { rows }) => {
                        const actions = [];
                        for (let i = 0; i < rows.length; i++) {
                            const row = rows.item(i);
                            actions.push({
                                id: row.id,
                                actionType: row.action_type,
                                payload: JSON.parse(row.payload)
                            });
                        }
                        resolve(actions);
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    /**
     * Remove a pending action after successful sync
     */
    async removePendingAction(id: number): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql('DELETE FROM pending_actions WHERE id = ?', [id]);
            }, reject, () => resolve());
        });
    }

    /**
     * Get last sync time for a data type
     */
    async getLastSyncTime(key: string): Promise<Date | null> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql(
                    'SELECT value FROM cache_metadata WHERE key = ?',
                    [key],
                    (_, { rows }) => {
                        if (rows.length > 0) {
                            resolve(new Date(rows.item(0).value));
                        } else {
                            resolve(null);
                        }
                    },
                    (_, error) => {
                        reject(error);
                        return false;
                    }
                );
            });
        });
    }

    /**
     * Clear old cache data (older than 30 days)
     */
    async clearOldCache(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql('DELETE FROM cached_attendance WHERE cached_at < ?', [thirtyDaysAgo]);
                tx.executeSql('DELETE FROM cached_activities WHERE cached_at < ?', [thirtyDaysAgo]);
            }, reject, () => {
                console.log('[Cache] Cleared old cache data');
                resolve();
            });
        });
    }

    /**
     * Clear all cache (for logout)
     */
    async clearAllCache(): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            this.db!.transaction(tx => {
                tx.executeSql('DELETE FROM cached_children');
                tx.executeSql('DELETE FROM cached_attendance');
                tx.executeSql('DELETE FROM cached_activities');
                tx.executeSql('DELETE FROM cached_announcements');
                tx.executeSql('DELETE FROM cached_events');
                tx.executeSql('DELETE FROM cache_metadata');
            }, reject, () => {
                console.log('[Cache] Cleared all cache');
                resolve();
            });
        });
    }
}

export const offlineCache = new OfflineCacheService();
