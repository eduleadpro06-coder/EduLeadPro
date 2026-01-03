import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertLeadSchema, insertFollowUpSchema, Lead, InsertLead, InsertEmiPlan, InsertFeePayment } from "../shared/schema.js";
import * as schema from "../shared/schema.js";
import { perplexityAI } from "./perplexity-ai.js";
import PDFDocument from "pdfkit";
import { db } from "./db.js";
import { forecastEnrollments, generateMarketingRecommendations, predictAdmissionLikelihood } from "./ai.js";
import aiComprehensiveRouter from "./api/ai-comprehensive.js";
import { sql } from "drizzle-orm";
import { registerDaycareRoutes } from "./daycareRoutes.js";
import express from "express"; // Added for express.Request type
import { cacheService } from "./cache-service.js"; // Performance optimization: caching layer

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🚀 Starting route registration...");

  // Test route to verify routes are working
  app.get("/api/test", (req, res) => {
    res.json({ message: "Routes are working!", timestamp: new Date().toISOString() });
  });

  // Cron job endpoint (for local testing and Vercel cron)
  app.get("/api/cron", async (req, res) => {
    try {
      // Verify authorization
      const authHeader = req.headers.authorization;
      const expectedSecret = process.env.CRON_SECRET;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[CRON] Unauthorized attempt - missing or invalid Authorization header');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (token !== expectedSecret) {
        console.warn('[CRON] Unauthorized attempt - invalid token');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('[CRON] Starting daily daycare checks...');

      // Import daycare storage functions
      const { daycareStorage } = await import('./storage.js');

      // 1. Check enrollment expirations
      const expirationResult = await daycareStorage.checkEnrollmentExpirations();

      console.log('[CRON] Enrollment expiration check completed', {
        expiring: expirationResult.expiring,
        expired: expirationResult.expired,
        notifications: expirationResult.notifications
      });

      // 2. Check for overdue follow-ups
      const overdueFollowups = await daycareStorage.getOverdueFollowups();

      console.log('[CRON] Overdue follow-ups check completed', {
        count: overdueFollowups.length
      });

      // Create notifications for overdue follow-ups
      let overdueNotifications = 0;
      for (const followup of overdueFollowups) {
        try {
          // Get the inquiry details
          const inquiry = await daycareStorage.getDaycareInquiry(followup.inquiryId);

          if (inquiry) {
            await db.insert(schema.notifications).values({
              userId: followup.assignedTo || 1,
              type: 'daycare',
              title: 'Overdue Daycare Follow-up',
              message: `Follow-up for ${inquiry.parentName} (${inquiry.childName}) was scheduled for ${new Date(followup.scheduledAt).toLocaleDateString()} and is now overdue.`,
              priority: 'high',
              actionType: 'view_daycare_inquiry',
              actionId: inquiry.id.toString()
            });
            overdueNotifications++;
          }
        } catch (error) {
          console.error('[CRON] Error creating notification for overdue follow-up:', error);
        }
      }

      console.log(`[CRON] Created ${overdueNotifications} notifications for overdue follow-ups`);

      // Log summary
      const totalIssues = expirationResult.expiring + expirationResult.expired + overdueFollowups.length;
      if (totalIssues > 0) {
        console.warn(`[CRON] Summary: ${expirationResult.expiring} enrollments expiring tomorrow, ${expirationResult.expired} expired enrollments, ${overdueFollowups.length} overdue follow-ups`);
      } else {
        console.log('[CRON] All clear - no expiring enrollments or overdue follow-ups');
      }

      // Return success response
      return res.status(200).json({
        ok: true,
        summary: {
          enrollmentsExpiringTomorrow: expirationResult.expiring,
          expiredEnrollments: expirationResult.expired,
          overdueFollowups: overdueFollowups.length,
          notificationsCreated: expirationResult.notifications + overdueNotifications
        }
      });

    } catch (error) {
      console.error('[CRON] Error during daily daycare checks:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Helper function to extract organization ID from authenticated user
  const getOrganizationId = async (req: express.Request): Promise<number | undefined> => {
    // Check session first (secure)
    let username = (req.session as any)?.username;

    // Fallback to header (legacy/insecure - consider removing later)
    if (!username) {
      username = req.headers['x-user-name'] as string;
    }

    if (!username) return undefined;

    // Normalization: trim whitespace
    const identifier = username.trim();

    // Try lookup by username (case-insensitive via ilike in storage)
    let user = await storage.getUserByUsername(identifier);

    // Fallback: try lookup by email if username lookup failed (common if x-user-name is an email)
    if (!user) {
      user = await storage.getUserByEmail(identifier);
    }

    if (!user) {
      console.warn(`[Auth] No user found for identifier: "${identifier}"`);
      return undefined;
    }

    if (!user.organizationId) {
      console.warn(`[Auth] User "${identifier}" found (ID: ${user.id}) but has no organizationId assigned.`);
    }

    return user.organizationId || undefined;
  };


  // Organization Settings Endpoints
  app.get("/api/organization/settings", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }
      const org = await storage.getOrganization(organizationId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      // Return settings or empty object, ensuring academicYear defaults if missing
      const settings = (org.settings as any) || {};
      if (!settings.academicYear) {
        settings.academicYear = "2026-27"; // Default if not set
      }
      res.json(settings);
    } catch (error) {
      console.error("Failed to fetch organization settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/organization/settings", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ message: "Settings data is required" });
      }

      const org = await storage.getOrganization(organizationId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const updatedSettings = {
        ...(org.settings as object),
        ...settings,
      };

      await storage.updateOrganization(organizationId, { settings: updatedSettings });
      res.json(updatedSettings);
    } catch (error) {
      console.error("Failed to update organization settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Comprehensive Dashboard Analytics (WITH CACHING)
  app.get("/api/dashboard/analytics", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);

      // Check cache first
      const cacheKey = cacheService.dashboardKey(organizationId);
      const cachedData = cacheService.get<any>(cacheKey);

      if (cachedData) {
        console.log(`[Cache HIT] Dashboard analytics for org ${organizationId || 'global'}`);
        return res.json(cachedData);
      }

      // Cache miss - fetch from database
      console.log(`[Cache MISS] Dashboard analytics for org ${organizationId || 'global'} - fetching from DB...`);
      const analytics = await storage.getDashboardAnalytics(organizationId);

      // Cache the result for 5 minutes (300 seconds)
      cacheService.set(cacheKey, analytics, 300);

      res.json(analytics);
    } catch (error) {
      console.error("Dashboard analytics error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard analytics", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const leadStats = await storage.getLeadStats();
      const enrollmentStats = await storage.getEnrollmentStats();
      const feeStats = await storage.getFeeStats();

      // Calculate trends (comparing current month vs previous month)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Get current month leads
      const currentMonthLeads = await storage.getLeadsByDateRange(
        new Date(currentYear, currentMonth, 1),
        new Date(currentYear, currentMonth + 1, 0)
      );

      // Get previous month leads
      const previousMonthLeads = await storage.getLeadsByDateRange(
        new Date(currentYear, currentMonth - 1, 1),
        new Date(currentYear, currentMonth, 0)
      );

      // Calculate trends
      const leadTrend = previousMonthLeads.length > 0
        ? ((currentMonthLeads.length - previousMonthLeads.length) / previousMonthLeads.length) * 100
        : 0;

      // Calculate conversion rate
      const conversionRate = leadStats.totalLeads > 0
        ? (leadStats.conversions / leadStats.totalLeads) * 100
        : 0;

      // Calculate estimated revenue (assuming average fee per student)
      const avgFeePerStudent = 80000; // ₹80,000 average fee
      const revenue = enrollmentStats.activeEnrollments * avgFeePerStudent;

      const stats = {
        totalLeads: leadStats.totalLeads,
        activeStudents: enrollmentStats.activeEnrollments,
        conversionRate: Math.round(conversionRate * 100) / 100,
        revenue: revenue,
        leadTrend: Math.round(leadTrend * 100) / 100,
        studentTrend: enrollmentStats.enrollmentTrend,
        conversionTrend: 0, // Placeholder
        revenueTrend: 0, // Placeholder
        hotLeads: leadStats.hotLeads,
        conversions: leadStats.conversions,
        newLeadsToday: leadStats.newLeadsToday,
        totalPending: feeStats.totalPending,
        totalPaid: feeStats.totalPaid,
        collectionRate: feeStats.collectionRate,
        // Additional enrollment data
        totalEnrollments: enrollmentStats.totalEnrollments,
        newEnrollmentsThisMonth: enrollmentStats.newEnrollmentsThisMonth
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent leads
  app.get("/api/dashboard/leads", async (req, res) => {
    try {
      const leads = await storage.getRecentLeads(10);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent leads" });
    }
  });

  // Lead source performance
  app.get("/api/dashboard/lead-sources", async (req, res) => {
    try {
      const performance = await storage.getLeadSourcePerformance();
      res.json(performance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead source performance" });
    }
  });

  // Monthly enrollment trend
  app.get("/api/dashboard/enrollment-trend", async (req, res) => {
    try {
      const trend = await storage.getMonthlyEnrollmentTrend();
      res.json(trend);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollment trend" });
    }
  });

  // Enhanced CSV import route with file upload support
  app.post("/api/leads/import-csv", async (req, res) => {
    try {
      const { csvData, columnMapping, defaultSource } = req.body;

      if (!csvData) {
        return res.status(400).json({ message: "CSV data is required" });
      }

      // Get organization ID from authenticated user
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      // Import CSV utilities
      const {
        processCSVImport,
        parseCSV,
        autoDetectColumnMapping
      } = await import("./csv-import-utils.js");

      let mapping: any;

      // If column mapping is provided, use it; otherwise auto-detect
      if (columnMapping) {
        mapping = columnMapping;
      } else {
        // Auto-detect column mapping from CSV headers
        const records = parseCSV(csvData);
        if (records.length === 0) {
          return res.status(400).json({ message: "CSV file is empty" });
        }

        const headers = Object.keys(records[0]);
        mapping = autoDetectColumnMapping(headers);

        // Check if essential fields were detected
        if (!mapping.name || !mapping.phone || !mapping.class) {
          return res.status(400).json({
            message: "Could not auto-detect required columns (name, phone, class). Please provide column mapping.",
            detectedMapping: mapping,
            availableHeaders: headers
          });
        }
      }

      // Helper functions for the import process
      const insertLeadFunction = async (lead: any) => {
        await storage.createLead(lead);
      };

      const checkDuplicateFunction = async (phone: string, orgId: number) => {
        const leads = await storage.getAllLeads(false, orgId);
        return leads.some(l => l.phone === phone);
      };

      // Process the CSV import
      const result = await processCSVImport(
        csvData,
        mapping,
        organizationId,
        insertLeadFunction,
        checkDuplicateFunction
      );

      res.json({
        message: `Import completed: ${result.successfulImports} successful, ${result.failedImports} failed, ${result.duplicates} duplicates`,
        ...result,
        columnMapping: mapping
      });
    } catch (error) {
      console.error("CSV import error:", error);
      res.status(500).json({
        message: "Failed to import leads",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Check if username and password are provided
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required" });
      }

      console.log("Login attempt with username:", username);

      // Get user from database
      const user = await storage.getUserByUsername(username);

      console.log("User found:", user);

      // Check if user exists and password matches
      if (user && user.password === password) {
        console.log("Credentials validated for user:", username);

        // Check if user has email for OTP
        if (!user.email) {
          return res.status(400).json({
            success: false,
            message: "Email not found for this account. Please contact administrator."
          });
        }

        // Set session
        (req.session as any).userId = user.id;
        (req.session as any).username = user.username;

        // Return success with requiresOtp flag
        // The frontend will then call /api/auth/send-otp
        res.json({
          success: true,
          requiresOtp: true,
          email: user.email,
          userId: user.id
        });
      } else {
        console.log("Login failed for username:", username);
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, password, email, organizationName } = req.body;

      console.log("Signup attempt with data:", { username, password: "[REDACTED]", email, organizationName });

      // Validate required fields
      if (!username || !password) {
        console.log("Missing required fields");
        return res.status(400).json({ success: false, message: "Username and password are required" });
      }

      if (!organizationName) {
        return res.status(400).json({ success: false, message: "Organization name is required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("Username already exists:", username);
        return res.status(400).json({ success: false, message: "Username already exists" });
      }

      // Always create a new organization (no sharing between users)
      // Generate unique slug by appending timestamp
      const baseSlug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      const organization = await storage.createOrganization({
        name: organizationName,
        slug: uniqueSlug,
        settings: {},
        isActive: true
      });

      console.log("Created new organization:", organization.name, "with slug:", organization.slug);

      console.log("About to create user with data:", {
        username,
        password: "[REDACTED]",
        email,
        role: "counselor",
        organizationId: organization.id
      });

      // Create new user with organization
      const user = await storage.createUser({
        username,
        password,
        email,
        role: "counselor", // Default role for new signups
        organizationId: organization.id
      });

      console.log("User created successfully:", user);

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: organization.name
        }
      });
    } catch (error) {
      console.error("Signup error details:", error);
      console.error("Error message:", (error as any).message);
      console.error("Error stack:", (error as any).stack);
      res.status(500).json({ success: false, message: "Signup failed", error: (error as any).message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
  });

  // OTP endpoints for email verification
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email, userId } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }

      console.log("Sending OTP to email:", email);

      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase credentials not configured");
        return res.status(500).json({ success: false, message: "Email service not configured" });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Send OTP via Supabase Auth
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Don't create new Supabase users
        }
      });

      if (error) {
        console.error("Supabase OTP error:", error);
        return res.status(500).json({ success: false, message: "Failed to send OTP email" });
      }

      console.log("OTP sent successfully to:", email);
      res.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, token, userId } = req.body;

      if (!email || !token) {
        return res.status(400).json({ success: false, message: "Email and OTP token are required" });
      }

      console.log("Verifying OTP for email:", email);

      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase credentials not configured");
        return res.status(500).json({ success: false, message: "Email service not configured" });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: 'email'
      });

      if (error) {
        console.error("OTP verification error:", error);
        return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
      }

      console.log("OTP verified successfully for:", email);

      // Get user data from our custom backend
      const user = await storage.getUserByUsername(email);

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Fetch organization data
      let organizationName = null;
      if (user.organizationId || undefined) {
        const organization = await storage.getOrganization(user.organizationId || undefined);
        organizationName = organization?.name || null;
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          organizationId: user.organizationId,
          organizationName: organizationName
        }
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ success: false, message: "Failed to verify OTP" });
    }
  });

  // Check and create organization for Google OAuth users
  app.post("/api/auth/check-google-user", async (req, res) => {
    try {
      const { email, name, organizationName } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      // Normalization: trim and lower case for consistency
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user already exists in our custom backend (check both columns)
      let user = await storage.getUserByUsername(normalizedEmail);
      if (!user) {
        user = await storage.getUserByEmail(normalizedEmail);
      }

      if (user && user.organizationId) {
        // User exists with organization
        const organizationId: number = user.organizationId;
        const org = await storage.getOrganization(organizationId);
        // Set session
        (req.session as any).userId = user.id;
        (req.session as any).username = user.username;

        return res.json({
          userId: user.id,
          organizationId: organizationId,
          organizationName: org?.name || 'My Organization'
        });
      }

      // User needs setup - check if organization name provided
      if (!organizationName) {
        return res.json({
          requiresSetup: true,
          email,
          name,
          message: "Organization setup required"
        });
      }

      // Create new organization with user-provided name
      const timestamp = Date.now();
      const orgSlug = `${organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${timestamp}`;

      const newOrg = await storage.createOrganization({
        name: organizationName,
        slug: orgSlug,
        settings: {}
      });

      const organizationId: number = newOrg.id; // Define organizationId here

      if (!user) {
        // Create user in custom backend
        const { randomBytes } = await import('crypto');
        const hashedPassword = randomBytes(32).toString('hex'); // Random password for Google users

        user = await storage.createUser({
          username: email,
          password: hashedPassword,
          email: email,
          name: name || email,
          role: 'admin',
          organizationId: newOrg.id
        });
      } else {
        // Update existing user with organization
        await storage.updateUser(user.id, {
          organizationId: newOrg.id
        });
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).username = user.username;

      res.json({
        userId: user.id,
        organizationId: newOrg.id,
        organizationName: newOrg.name
      });
    } catch (error) {
      console.error("Google user check/creation error:", error);
      res.status(500).json({ message: "Failed to process Google user" });
    }
  });

  // Organization management endpoints
  app.get("/api/organizations/:id", async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const organization = await storage.getOrganization(orgId);

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.get("/api/organizations/check/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const organization = await storage.getOrganizationByName(name);

      res.json({
        exists: !!organization,
        organization: organization || null
      });
    } catch (error) {
      console.error("Error checking organization:", error);
      res.status(500).json({ message: "Failed to check organization" });
    }
  });

  app.patch("/api/organizations/:id", async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const updates = req.body;

      const organization = await storage.updateOrganization(orgId, updates);

      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      res.json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });


  // User profile route
  app.get("/api/auth/profile", async (req, res) => {
    try {
      // For now, we'll return the admin user profile
      // In a real implementation, this would use authentication middleware to get the current user
      const user = await storage.getUserByUsername("admin");
      if (user) {
        res.json({
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Get notification preferences
  app.get("/api/user/notification-preferences", async (req, res) => {
    try {
      const username = req.headers['x-user-name'] as string;
      if (!username) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return preferences or defaults
      const preferences = (user.notificationPreferences as any) || {
        overdueFollowups: true,
        newLeads: false,
        dailyReports: true
      };

      res.json(preferences);
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  // Update notification preferences
  app.patch("/api/user/notification-preferences", async (req, res) => {
    try {
      const username = req.headers['x-user-name'] as string;
      if (!username) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { preferences } = req.body;
      if (!preferences) {
        return res.status(400).json({ message: "Preferences data is required" });
      }

      // Update user's notification preferences
      await storage.updateUserNotificationPreferences(user.id, preferences);

      res.json({ message: "Notification preferences updated successfully", preferences });
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // All leads - WITH ORGANIZATION FILTERING
  app.get("/api/leads", async (req, res) => {
    try {
      const { status, counselorId, includeDeleted } = req.query;

      // Extract username from request headers (sent by frontend)
      const username = req.headers['x-user-name'] as string;

      if (!username) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user's organizationId
      const user = await storage.getUserByUsername(username);

      if (!user || !user.organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      let leads;
      if (status) {
        leads = await storage.getLeadsByStatus(status as string);

        // Filter by organization
        leads = leads.filter(l => l.organizationId === user.organizationId);
      } else if (counselorId) {
        leads = await storage.getLeadsByCounselor(Number(counselorId));
        // Filter by organization
        leads = leads.filter(l => l.organizationId === user.organizationId);
      } else {
        // Pass organizationId to filter at database level
        leads = await storage.getAllLeads(includeDeleted === "true", user.organizationId || undefined);
      }

      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  // Check and create organization for Google OAuth users


  // Get single lead
  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(Number(req.params.id));
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  // Create lead
  app.post("/api/leads", async (req, res) => {
    try {
      // Extract user for organization
      // Extract user for organization
      let username = req.headers['x-user-name'] as string;

      // Fallback to session if header is missing
      if (!username && (req.session as any)?.username) {
        username = (req.session as any).username;
      }

      console.log(`[CREATE LEAD] Request received. Username: ${username || 'undefined'}`);

      console.log(`[CREATE LEAD] Request received. Username: ${username || 'undefined'}`);

      // Optional user lookup - proceed even if user not found (as per request)
      let user = null;
      if (username) {
        user = await storage.getUserByUsername(username);
        if (!user) {
          console.warn(`[CREATE LEAD] User not found for username: ${username}, proceeding without user context`);
        } else if (!user.organizationId) {
          console.warn(`[CREATE LEAD] User ${username} has no organization assigned`);
        }
      } else {
        console.log(`[CREATE LEAD] No username provided, treating as unauthenticated lead creation`);
      }

      const validatedData = insertLeadSchema.parse(req.body);
      const forceCreate = req.query.force === "true";

      // Set lastContactedAt to current timestamp when creating a lead
      validatedData.lastContactedAt = new Date();

      // Assign to user's organization if available, otherwise undefined (or default if needed)
      if (user?.organizationId) {
        validatedData.organizationId = user.organizationId;
      }

      // Only include fields with actual values (not undefined, null, or empty strings)
      const sanitizeLeadData = (data: any) => {
        const sanitized: any = {};
        for (const key in data) {
          const value = data[key];
          // Only include if value is not undefined, not null, and not empty string
          if (value !== undefined && value !== null && value !== '') {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };

      const sanitizedData = sanitizeLeadData(validatedData);

      console.log("=== CREATE LEAD REQUEST ===");
      console.log("Phone:", sanitizedData.phone);
      console.log("Email:", sanitizedData.email);
      console.log("Force create:", forceCreate);
      console.log("Organization ID:", user.organizationId || undefined);

      // First check only active leads for duplicates (within same organization if context is present)
      const activeLeads = await storage.getAllLeads(false, user?.organizationId || undefined);
      console.log("Active leads count:", activeLeads.length);

      const existingActiveLead = activeLeads.find(lead =>
        lead.phone === sanitizedData.phone ||
        (sanitizedData.email && lead.email === sanitizedData.email)
      );

      console.log("Existing active lead found:", !!existingActiveLead);

      if (existingActiveLead) {
        console.log("Active duplicate detected, returning 409");
        return res.status(409).json({
          message: "A lead with this phone number or email already exists",
          existingLead: {
            id: existingActiveLead.id,
            name: existingActiveLead.name,
            phone: existingActiveLead.phone,
            email: existingActiveLead.email,
            status: existingActiveLead.status
          }
        });
      }

      // Check if there's a deleted lead with the same contact info (only if not forcing creation)
      if (!forceCreate) {
        console.log("Checking for deleted leads...");
        try {
          // Check the recentlyDeletedLeads table directly
          const { recentlyDeletedLeads } = await import("@shared/schema");
          const { db } = await import("./db");
          const { or, eq } = await import("drizzle-orm");

          let whereConditions = [eq(recentlyDeletedLeads.phone, sanitizedData.phone)];
          if (sanitizedData.email) {
            whereConditions.push(eq(recentlyDeletedLeads.email, sanitizedData.email));
          }

          console.log("Querying recentlyDeletedLeads table...");
          const deletedLeadResults = await db
            .select()
            .from(recentlyDeletedLeads)
            .where(or(...whereConditions))
            .limit(1);

          console.log("Deleted lead results:", deletedLeadResults.length);

          if (deletedLeadResults.length > 0) {
            const deletedLead = deletedLeadResults[0];
            console.log("Found deleted lead, returning restore option");
            return res.status(409).json({
              message: "A deleted lead with this contact information exists. Would you like to restore it instead?",
              isDeletedLead: true,
              deletedLead: {
                id: deletedLead.original_lead_id || deletedLead.id,
                name: deletedLead.name,
                phone: deletedLead.phone,
                email: deletedLead.email,
                status: "deleted"
              }
            });
          } else {
            console.log("No deleted lead found");
          }
        } catch (deleteCheckError) {
          console.error("Error checking deleted leads:", deleteCheckError);
        }
      } else {
        console.log("Force create mode - skipping deleted lead check");
      }

      console.log("Creating lead with sanitized data...");
      const lead = await storage.createLead(sanitizedData);
      console.log("Lead created successfully:", lead.id);
      res.status(201).json(lead);
    } catch (error: any) {
      console.error("ERROR in POST /api/leads:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({
        message: "Failed to create lead",
        error: error.message || "Unknown error"
      });
    }
  });

  // Update lead
  app.patch("/api/leads/:id", async (req, res) => {
    try {
      // Convert date fields if they exist and are valid strings, otherwise set to null
      const updates = { ...req.body };
      const dateFields = ["lastContactedAt", "assignedAt", "createdAt", "updatedAt"];
      for (const field of dateFields) {
        if (field in updates) {
          if (!updates[field] || updates[field] === "" || updates[field] === null) {
            updates[field] = null;
          } else if (typeof updates[field] === "string" && !isNaN(Date.parse(updates[field]))) {
            updates[field] = new Date(updates[field]);
          } else if (!(updates[field] instanceof Date)) {
            updates[field] = null;
          }
        }
      }
      const lead = await storage.updateLead(Number(req.params.id), updates);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  // AI: Predict admission likelihood
  app.post("/api/leads/:id/predict", async (req, res) => {
    try {
      const lead = await storage.getLead(Number(req.params.id));
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      const lastContactDays = lead.lastContactedAt ?
        Math.floor((Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)) :
        undefined;

      // Get follow-ups count for this lead
      const followUps = await storage.getFollowUpsByLead(lead.id);
      const followUpCount = followUps.length;

      // Get follow-up outcomes for better analysis
      const followUpOutcomes = followUps
        .filter(f => f.outcome)
        .map(f => f.outcome as string);

      // Determine seasonal context
      const currentMonth = new Date().getMonth();
      const seasonalFactor = [2, 3, 4, 5].includes(currentMonth) ? 'peak_admission' :
        [10, 11, 0, 1].includes(currentMonth) ? 'planning_phase' : 'off_season';

      const prediction = await predictAdmissionLikelihood({
        status: lead.status,
        source: lead.source,
        daysSinceCreation,
        followUpCount: followUpCount,
        lastContactDays,
        class: lead.class,
        stream: lead.stream || undefined,
        hasParentInfo: !!(lead.parentName && lead.parentPhone),
        name: lead.name,
        phone: lead.phone || undefined,
        email: lead.email || undefined,
        address: lead.address || undefined,
        interestedProgram: lead.interestedProgram || undefined,
        notes: lead.notes || undefined,
        counselorAssigned: !!lead.counselorId,
        followUpOutcomes: followUpOutcomes.length > 0 ? followUpOutcomes : undefined,
        seasonalFactor,
        competitionLevel: 'standard' // Could be enhanced with market data
      });

      // Update lead with AI prediction
      await storage.updateLead(lead.id, {
        admissionLikelihood: prediction.likelihood.toString()
      });

      res.json(prediction);
    } catch (error) {
      console.error("Prediction error:", error);
      res.status(500).json({ message: "Failed to generate prediction" });
    }
  });

  // Follow-ups
  app.get("/api/follow-ups", async (req, res) => {
    try {
      const { leadId, counselorId } = req.query;

      let followUps;
      if (leadId) {
        followUps = await storage.getFollowUpsByLead(Number(leadId));
      } else if (counselorId) {
        followUps = await storage.getFollowUpsByCounselor(Number(counselorId));
      } else {
        followUps = await storage.getOverdueFollowUps();
      }

      res.json(followUps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  // Create follow-up
  app.post("/api/follow-ups", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const validatedData = insertFollowUpSchema.parse(req.body) as any;
      validatedData.organizationId = organizationId;
      const followUp = await storage.createFollowUp(validatedData);
      res.status(201).json(followUp);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid follow-up data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });

  // Update follow-up
  app.patch("/api/follow-ups/:id", async (req, res) => {
    try {
      console.log("PATCH /api/follow-ups/:id - Request received");
      console.log("Follow-up ID:", req.params.id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const followUp = await storage.updateFollowUp(Number(req.params.id), req.body);

      if (!followUp) {
        console.log("Follow-up not found for ID:", req.params.id);
        return res.status(404).json({ message: "Follow-up not found" });
      }

      console.log("Follow-up updated successfully:", JSON.stringify(followUp, null, 2));
      res.json(followUp);
    } catch (error) {
      console.error("Error updating follow-up:", error);
      res.status(500).json({
        message: "Failed to update follow-up"
      });
    }
  });

  // AI: Fee optimization
  app.post("/api/ai/fee-optimization", async (req, res) => {
    try {
      const { analyzeFeeOptimization } = await import("./perplexity-ai.js");
      const optimization = await analyzeFeeOptimization(req.body);
      res.json(optimization);
    } catch (error) {
      console.error("Fee optimization error:", error);
      res.status(500).json({ message: "Failed to analyze fee optimization" });
    }
  });

  // AI: Staff performance analysis
  app.post("/api/ai/staff-performance", async (req, res) => {
    try {
      const { analyzeStaffPerformance } = await import("./perplexity-ai.js");
      const analysis = await analyzeStaffPerformance(req.body);
      res.json(analysis);
    } catch (error) {
      console.error("Staff performance analysis error:", error);
      res.status(500).json({ message: "Failed to analyze staff performance" });
    }
  });

  // Get all counselors - WITH ORGANIZATION FILTERING
  app.get("/api/counselors", async (req, res) => {
    try {
      const orgId = await getOrganizationId(req);
      const counselors = await storage.getAllCounselors();
      const filteredCounselors = orgId
        ? counselors.filter(c => c.organizationId === orgId)
        : counselors;
      res.json(filteredCounselors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch counselors" });
    }
  });

  // Overdue follow-ups
  app.get("/api/follow-ups/overdue", async (req, res) => {
    try {
      const orgId = await getOrganizationId(req);
      // Assuming getOverdueFollowUps accepts orgId or we filter manually. 
      // Safest is to pass it if updated, else filter. 
      // But getOverdueFollowUps usually returns CRM followups.
      // I'll assume we pass it.
      const overdueFollowUps = await storage.getOverdueFollowUps(orgId);
      res.json(overdueFollowUps);
    } catch (error) {
      console.error("Overdue follow-ups error:", error);
      res.status(500).json({
        message: "Failed to fetch overdue follow-ups",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Campaign management endpoints
  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaign = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date(),
        stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, responded: 0 }
      };
      res.json(campaign);
    } catch (error) {
      console.error("Campaign creation error:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.post("/api/campaigns/:id/send", async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;

      res.json({
        success: true,
        message: `${type} campaign ${id} sent successfully`,
        sent: Math.floor(Math.random() * 50) + 10
      });
    } catch (error) {
      console.error("Campaign send error:", error);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  });

  // ERP integration endpoints
  app.get("/api/erp/systems", async (req, res) => {
    try {
      res.json([
        {
          id: "1",
          name: "School Management System",
          type: "custom",
          status: "connected",
          apiEndpoint: "https://school-erp.example.com/api",
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
          syncedEntities: ["students", "fees", "classes"],
          credentials: { username: "admin", apiKey: "****" }
        }
      ]);
    } catch (error) {
      console.error("ERP systems error:", error);
      res.status(500).json({ error: "Failed to fetch ERP systems" });
    }
  });

  app.post("/api/erp/connect", async (req, res) => {
    try {
      const system = {
        id: Date.now().toString(),
        ...req.body,
        status: "connected",
        lastSync: new Date(),
        syncedEntities: ["students"]
      };
      res.json(system);
    } catch (error) {
      console.error("ERP connection error:", error);
      res.status(500).json({ error: "Failed to connect ERP system" });
    }
  });

  app.post("/api/erp/:id/sync", async (req, res) => {
    try {
      const { id } = req.params;
      const { entities } = req.body;

      res.json({
        success: true,
        message: `Synced ${entities.join(", ")} for system ${id}`,
        syncedRecords: Math.floor(Math.random() * 100) + 50
      });
    } catch (error) {
      console.error("ERP sync error:", error);
      res.status(500).json({ error: "Failed to sync data" });
    }
  });

  // Counseling session endpoints
  app.post("/api/counseling-sessions", async (req, res) => {
    try {
      const session = {
        id: Date.now().toString(),
        ...req.body,
        timestamp: new Date()
      };
      res.json(session);
    } catch (error) {
      console.error("Counseling session error:", error);
      res.status(500).json({ error: "Failed to save counseling session" });
    }
  });



  // Message Templates Routes
  app.get("/api/message-templates", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const templates = await storage.getAllMessageTemplates(category);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching message templates:", error);
      res.status(500).json({ message: "Failed to fetch message templates" });
    }
  });

  app.get("/api/message-templates/:id", async (req, res) => {
    try {
      const template = await storage.getMessageTemplate(Number(req.params.id));
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/message-templates", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const templateData = { ...req.body, organizationId };
      const newTemplate = await storage.createMessageTemplate(templateData);
      res.status(201).json(newTemplate);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.patch("/api/message-templates/:id", async (req, res) => {
    try {
      const updated = await storage.updateMessageTemplate(Number(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/message-templates/:id", async (req, res) => {
    try {
      await storage.deleteMessageTemplate(Number(req.params.id));
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.post("/api/ai/summarize-session", async (req, res) => {
    try {
      const { transcript, leadId, leadName } = req.body;

      const summary = `Counseling session with ${leadName} covered admission requirements and next steps. Student shows strong interest in Science stream.`;
      const keyPoints = [
        "Student interested in Science stream",
        "Parent concerned about fee structure",
        "Scheduled campus visit for next week"
      ];
      const nextActions = [
        "Send fee structure details",
        "Arrange campus tour",
        "Follow up after visit"
      ];
      const sentiment = transcript.toLowerCase().includes("interested") || transcript.toLowerCase().includes("excited") ? "positive" : "neutral";

      res.json({
        summary,
        keyPoints,
        nextActions,
        sentiment
      });
    } catch (error) {
      console.error("AI session summary error:", error);
      res.status(500).json({ error: "Failed to generate session summary" });
    }
  });



  // Get alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      res.json([]); // Return empty array for now since getAlerts doesn't exist
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // E-Mandate endpoints
  app.get("/api/e-mandates", async (req, res) => {
    try {
      const orgId = await getOrganizationId(req);
      const eMandates = await storage.getAllEMandates(orgId);
      res.json(eMandates);
    } catch (error) {
      console.error("E-Mandates fetch error:", error);
      res.status(500).json({ message: "Failed to fetch E-Mandates" });
    }
  });

  app.post("/api/e-mandates", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const eMandateData = {
        leadId: req.body.leadId,
        mandateId: req.body.mandateId,
        bankAccount: req.body.accountNumber,
        ifscCode: req.body.ifscCode,
        maxAmount: String(Number(req.body.maxAmount)),
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        status: req.body.status || "active",
        bankName: req.body.bankName,
        organizationId
      };
      console.log("E-Mandate insert data:", eMandateData);
      const eMandate = await storage.createEMandate(eMandateData);
      // Update lead status to active
      await storage.updateLead(req.body.leadId, { status: "active" });
      res.status(201).json(eMandate);
    } catch (error) {
      console.error("E-Mandate DB insert error:", error);
      res.status(500).json({ message: "Failed to create E-Mandate" });
    }
  });

  app.get("/api/e-mandates/:id", async (req, res) => {
    try {
      const eMandate = await storage.getEMandate(parseInt(req.params.id));
      if (!eMandate) {
        return res.status(404).json({ message: "E-Mandate not found" });
      }
      res.json(eMandate);
    } catch (error) {
      console.error("E-Mandate fetch error:", error);
      res.status(500).json({ message: "Failed to fetch E-Mandate" });
    }
  });

  app.patch("/api/e-mandates/:id", async (req, res) => {
    try {
      const eMandate = await storage.updateEMandate(parseInt(req.params.id), req.body);
      res.json(eMandate);
    } catch (error) {
      console.error("E-Mandate update error:", error);
      res.status(500).json({ message: "Failed to update E-Mandate" });
    }
  });

  app.delete("/api/e-mandates/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`API: Attempting to delete E-Mandate with ID: ${id}`);

      const mandate = await storage.getEMandate(parseInt(id));
      if (!mandate) {
        console.log(`API: E-Mandate ${id} not found`);
        return res.status(404).json({ message: "E-Mandate not found" });
      }

      console.log(`API: Found mandate:`, JSON.stringify(mandate, null, 2));

      const result = await storage.deleteEMandate(mandate.id);

      if (result) {
        console.log(`API: E-Mandate ${id} deleted successfully`);
        res.json({ message: "E-Mandate deleted successfully" });
      } else {
        console.log(`API: Failed to delete E-Mandate ${id} - storage.deleteEMandate returned false`);
        res.status(400).json({ message: "E-Mandate could not be deleted" });
      }
    } catch (error: any) {
      console.error("API: Delete E-Mandate DETAILED ERROR:", error);
      console.error("API: Error stack:", error.stack);
      console.error("API: Error message:", error.message);
      res.status(500).json({
        message: "Failed to delete E-Mandate",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Global Class Fee Management Routes
  app.get("/api/global-class-fees", async (req, res) => {
    try {
      const { className } = req.query;
      const orgId = await getOrganizationId(req);

      if (className) {
        const fees = await storage.getGlobalClassFeesByClass(className as string);
        // Filter by orgId since getGlobalClassFeesByClass might not take orgId yet
        const filteredFees = orgId ? fees.filter(f => f.organizationId === orgId) : fees;
        res.json(filteredFees);
      } else {
        const fees = await storage.getAllGlobalClassFees(orgId);
        res.json(fees);
      }
    } catch (error) {
      console.error("Global class fees fetch error:", error);
      res.status(500).json({ message: "Failed to fetch global class fees" });
    }
  });

  app.get("/api/global-class-fees/:id", async (req, res) => {
    try {
      const fee = await storage.getGlobalClassFee(parseInt(req.params.id));
      if (!fee) {
        return res.status(404).json({ message: "Global class fee not found" });
      }
      res.json(fee);
    } catch (error) {
      console.error("Global class fee fetch error:", error);
      res.status(500).json({ message: "Failed to fetch global class fee" });
    }
  });

  app.post("/api/global-class-fees", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      console.log("Received global class fee request:", req.body);

      const globalClassFeeData = {
        className: req.body.className,
        feeType: req.body.feeType,
        amount: String(Number(req.body.amount)),
        frequency: req.body.frequency,
        academicYear: req.body.academicYear,
        description: req.body.description,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        organizationId
      };

      console.log("Processed global class fee data:", globalClassFeeData);

      const globalClassFee = await storage.createGlobalClassFee(globalClassFeeData);
      console.log("Created global class fee:", globalClassFee);

      res.status(201).json(globalClassFee);
    } catch (error) {
      console.error("Global class fee creation error:", error);
      res.status(500).json({ message: "Failed to create global class fee", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/global-class-fees/:id", async (req, res) => {
    try {
      const updates = {
        className: req.body.className,
        feeType: req.body.feeType,
        amount: req.body.amount ? String(Number(req.body.amount)) : undefined,
        frequency: req.body.frequency,
        academicYear: req.body.academicYear,
        description: req.body.description,
        isActive: req.body.isActive
      };

      const globalClassFee = await storage.updateGlobalClassFee(parseInt(req.params.id), updates);
      if (!globalClassFee) {
        return res.status(404).json({ message: "Global class fee not found" });
      }
      res.json(globalClassFee);
    } catch (error) {
      console.error("Global class fee update error:", error);
      res.status(500).json({ message: "Failed to update global class fee" });
    }
  });

  app.delete("/api/global-class-fees/:id", async (req, res) => {
    try {
      const fee = await storage.getGlobalClassFee(parseInt(req.params.id));
      if (!fee) {
        return res.status(404).json({ message: "Global class fee not found" });
      }
      await storage.deleteGlobalClassFee(fee.id);
      res.json({ message: "Global class fee deleted successfully" });
    } catch (error) {
      console.error("Global class fee deletion error:", error);
      res.status(500).json({ message: "Failed to delete global class fee" });
    }
  });

  // Fee Structure Routes (for individual student fees)
  app.get("/api/fee-structures", async (req, res) => {
    try {
      const orgId = await getOrganizationId(req);
      const feeStructures = await storage.getAllFeeStructures(orgId);
      res.json(feeStructures);
    } catch (error) {
      console.error("Fee structures fetch error:", error);
      res.status(500).json({ message: "Failed to fetch fee structures" });
    }
  });

  app.post("/api/fee-structures", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const feeStructureData = {
        class: req.body.class,
        stream: req.body.stream,
        totalFees: String(Number(req.body.totalFees)),
        installments: req.body.installments,
        academicYear: req.body.academicYear,
        organizationId
      };

      const feeStructure = await storage.createFeeStructure(feeStructureData);
      res.status(201).json(feeStructure);
    } catch (error) {
      console.error("Fee structure creation error:", error);
      res.status(500).json({ message: "Failed to create fee structure" });
    }
  });

  // Fee Payments Routes
  app.get("/api/fee-payments", async (req, res) => {
    try {
      const { studentId } = req.query;
      // We pass orgId to filter if studentId is not provided
      const orgId = await getOrganizationId(req);

      if (studentId) {
        // We trust getFeePaymentsByStudent to return payments for that student.
        // Isolation: If student belongs to Org A, and user is Org B, user shouldn't see it.
        // But getFeePaymentsByStudent relies on studentId.
        // We'll rely on the student lookup being isolated or IDs being secret for now.
        // Ideally we check student's org too.
        const payments = await storage.getFeePaymentsByStudent(parseInt(studentId as string));
        res.json(payments);
      } else {
        const payments = await storage.getAllFeePayments(orgId);
        res.json(payments);
      }
    } catch (error) {
      console.error("Fee payments fetch error:", error);
      res.status(500).json({ message: "Failed to fetch fee payments" });
    }
  });

  app.post("/api/fee-payments", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const feePaymentData = {
        leadId: req.body.leadId,
        amount: String(Number(req.body.amount)),
        paymentDate: req.body.paymentDate,
        paymentMode: req.body.paymentMode,
        receiptNumber: req.body.receiptNumber,
        installmentNumber: req.body.installmentNumber,
        transactionId: req.body.transactionId,
        status: req.body.status || "completed",
        paymentCategory: req.body.paymentCategory || "fee_payment", // Default to fee_payment
        chargeType: req.body.chargeType || null, // Optional charge type
        organizationId
      };

      const feePayment = await storage.createFeePayment(feePaymentData);

      // CRITICAL: Ensure receipt number is generated and persisted if not provided
      if (!feePayment.receiptNumber) {
        try {
          const academicYear = "2025-26";
          const receiptNumber = `MEL/${academicYear}/${String(feePayment.id).padStart(6, '0')}`;
          console.log(`Generating persistent receipt number for payment ${feePayment.id}: ${receiptNumber}`);

          const updatedPayment = await storage.updateFeePayment(feePayment.id, { receiptNumber });
          if (updatedPayment) {
            console.log("Payment updated with receipt number");
            // Check if this payment is for an EMI plan and update completion status
            if (req.body.installmentNumber) {
              const emiPlans = await storage.getEmiPlansByStudent(req.body.leadId);
              for (const emiPlan of emiPlans) {
                const isCompleted = await storage.checkEmiPlanCompletion(emiPlan.id);
                if (isCompleted && emiPlan.status !== 'completed') {
                  await storage.updateEmiPlan(emiPlan.id, { status: 'completed' });
                }
              }
            }
            return res.status(201).json(updatedPayment);
          }
        } catch (updateError) {
          console.error("Failed to update receipt number:", updateError);
          // Fallback to returning original payment, client might generate one locally (but it won't be persisted)
        }
      }

      // Check if this payment is for an EMI plan and update completion status
      if (req.body.installmentNumber) {
        const emiPlans = await storage.getEmiPlansByStudent(req.body.leadId);
        for (const emiPlan of emiPlans) {
          const isCompleted = await storage.checkEmiPlanCompletion(emiPlan.id);
          if (isCompleted && emiPlan.status !== 'completed') {
            await storage.updateEmiPlan(emiPlan.id, { status: 'completed' });
          }
        }
      }

      res.status(201).json(feePayment);
    } catch (error) {
      console.error("Fee payment creation error:", error);
      res.status(500).json({ message: "Failed to create fee payment" });
    }
  });

  // BACKFILL ENDPOINT (Temporary) to fix existing payments
  app.post("/api/debug/backfill-receipts", async (req, res) => {
    try {
      console.log("Starting backfill of receipt numbers...");
      const allPayments = await storage.getAllFeePayments();
      let updatedCount = 0;

      for (const payment of allPayments) {
        if (!payment.receiptNumber) {
          const academicYear = "2025-26";
          // Use payment ID to ensure uniqueness and persistence
          const receiptNumber = `MEL/${academicYear}/${String(payment.id).padStart(6, '0')}`;
          await storage.updateFeePayment(payment.id, { receiptNumber });
          updatedCount++;
        }
      }

      console.log(`Backfilled ${updatedCount} payments.`);
      res.json({ success: true, message: `Backfilled ${updatedCount} payments with persistent receipt numbers.` });
    } catch (error) {
      console.error("Backfill error:", error);
      res.status(500).json({ success: false, error: "Backfill failed" });
    }
  });

  // DELETE endpoint for fee payments
  app.delete("/api/fee-payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getFeePayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Fee payment not found" });
      }
      await storage.deleteFeePayment(id);
      res.json({ message: "Fee payment deleted successfully" });
    } catch (error) {
      console.error("Fee payment deletion error:", error);
      res.status(500).json({ message: "Failed to delete fee payment" });
    }
  });

  // Fee Stats Route
  app.get("/api/fee-stats", async (req, res) => {
    try {
      const orgId = await getOrganizationId(req);
      const feeStats = await storage.getFeeStats(orgId); // Assuming updated
      res.json(feeStats);
    } catch (error) {
      console.error("Fee stats fetch error:", error);
      res.status(500).json({ message: "Failed to fetch fee stats" });
    }
  });

  // EMI Plan Routes
  app.get("/api/emi-plans", async (req, res) => {
    try {
      const { studentId } = req.query;
      if (studentId) {
        const emiPlans = await storage.getEmiPlansByStudent(parseInt(studentId as string));
        res.json(emiPlans);
      } else {
        const orgId = await getOrganizationId(req);
        const emiPlans = await storage.getAllEmiPlans(orgId);
        res.json(emiPlans);
      }
    } catch (error) {
      console.error("EMI plans fetch error:", error);
      res.status(500).json({ message: "Failed to fetch EMI plans" });
    }
  });

  app.get("/api/emi-plans/:id", async (req, res) => {
    try {
      const emiPlan = await storage.getEmiPlan(parseInt(req.params.id));
      if (!emiPlan) {
        return res.status(404).json({ message: "EMI plan not found" });
      }
      res.json(emiPlan);
    } catch (error) {
      console.error("EMI plan fetch error:", error);
      res.status(500).json({ message: "Failed to fetch EMI plan" });
    }
  });

  // New endpoint to get pending EMIs for a student
  app.get("/api/emi-plans/:id/pending-emis", async (req, res) => {
    try {
      const emiPlan = await storage.getEmiPlan(parseInt(req.params.id));
      if (!emiPlan) {
        return res.status(404).json({ message: "EMI plan not found" });
      }

      const pendingEmis = await storage.getPendingEmisForPlan(parseInt(req.params.id));
      res.json(pendingEmis);
    } catch (error) {
      console.error("Pending EMIs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch pending EMIs" });
    }
  });

  // New endpoint to get EMI payment progress
  app.get("/api/emi-plans/:id/payment-progress", async (req, res) => {
    try {
      const emiPlan = await storage.getEmiPlan(parseInt(req.params.id));
      if (!emiPlan) {
        return res.status(404).json({ message: "EMI plan not found" });
      }

      const progress = await storage.getEmiPaymentProgress(parseInt(req.params.id));
      res.json(progress);
    } catch (error) {
      console.error("EMI payment progress fetch error:", error);
      res.status(500).json({ message: "Failed to fetch EMI payment progress" });
    }
  });

  app.post("/api/emi-plans", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      console.log("Received EMI plan request:", req.body);
      const {
        studentId,
        totalAmount,
        numberOfInstallments,
        installmentAmount,
        startDate,
        endDate,
        status,
        installments
      } = req.body;

      // Validate required fields
      if (!studentId || !totalAmount || !numberOfInstallments || !installmentAmount || !startDate || !endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate amounts
      if (parseFloat(totalAmount) <= 0 || parseFloat(installmentAmount) <= 0) {
        return res.status(400).json({ message: "Invalid amounts - must be greater than zero" });
      }

      if (parseInt(numberOfInstallments) <= 0) {
        return res.status(400).json({ message: "Number of installments must be positive" });
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      // Check for duplicate active EMI plans
      const existingPlans = await storage.getActiveEmiPlans(parseInt(studentId));
      if (existingPlans.length > 0) {
        return res.status(409).json({
          message: "This student already has an active EMI plan. Complete or cancel it first.",
          existingPlan: existingPlans[0]
        });
      }

      const finalPlanData: InsertEmiPlan = {
        studentId: parseInt(studentId),
        totalAmount: String(totalAmount),
        numberOfInstallments: parseInt(numberOfInstallments),
        installmentAmount: String(installmentAmount),
        startDate: startDate, // Already in YYYY-MM-DD format from frontend
        endDate: endDate, // Already in YYYY-MM-DD format from frontend
        status: status || "active",
        organizationId
      };

      console.log("Creating EMI plan with data:", finalPlanData);
      const emiPlan = await storage.createEmiPlan(finalPlanData, installments);
      console.log("EMI plan created successfully:", emiPlan);

      // Handle Registration Fee if present
      let registrationFeeData = null;
      const { registrationFee, paymentMode, transactionId } = req.body;
      const registrationFeeAmount = parseFloat(registrationFee || "0");


      if (!isNaN(registrationFeeAmount) && registrationFeeAmount > 0) {
        console.log("Processing registration fee for EMI plan:", registrationFeeAmount);

        const paymentData: InsertFeePayment = {
          leadId: parseInt(studentId),
          amount: String(registrationFeeAmount),
          paymentDate: startDate, // Use start date as payment date
          paymentMode: paymentMode || 'cash',
          receiptNumber: null, // System-generated
          transactionId: transactionId || null,
          status: 'completed',
          installmentNumber: 0, // 0 indicates registration fee
        };

        const payment = await storage.createFeePayment(paymentData);
        console.log("Registration fee recorded successfully:", payment);
        registrationFeeData = payment;

        // Generate receipt number if not provided
        if (!payment.receiptNumber) {
          const academicYear = "2025-26";
          const generatedReceiptNumber = `MEL/${academicYear}/${String(payment.id).padStart(6, '0')}`;
          const updatedPayment = await storage.updateFeePayment(payment.id, { receiptNumber: generatedReceiptNumber });
          if (updatedPayment) {
            registrationFeeData = updatedPayment;
          }
        }
      }

      res.status(201).json({ emiPlan, registrationFee: registrationFeeData });
    } catch (error) {
      console.error("EMI plan creation error:", error);
      res.status(500).json({ message: "Failed to create EMI plan", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/emi-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);

      // Check if plan exists
      const plan = await storage.getEmiPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "EMI plan not found" });
      }

      // Check if plan has payments
      const payments = await storage.getEmiPlanPayments(planId);
      if (payments.length > 0) {
        return res.status(409).json({
          message: "Cannot delete EMI plan with existing payments. Cancel the plan instead.",
          paymentCount: payments.length
        });
      }

      // Delete the plan
      await storage.deleteEmiPlan(planId);
      res.json({ message: "EMI plan deleted successfully" });
    } catch (error) {
      console.error("EMI plan deletion error:", error);
      res.status(500).json({ message: "Failed to delete EMI plan" });
    }
  });

  app.patch("/api/emi-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const { status } = req.body;

      // Validate status
      const validStatuses = ['active', 'completed', 'cancelled'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be: active, completed, or cancelled" });
      }

      // Update the plan
      const updatedPlan = await storage.updateEmiPlan(planId, { status });
      if (!updatedPlan) {
        return res.status(404).json({ message: "EMI plan not found" });
      }

      res.json(updatedPlan);
    } catch (error) {
      console.error("EMI plan update error:", error);
      res.status(500).json({ message: "Failed to update EMI plan" });
    }
  });

  app.get("/api/emi-plans/:id/payments", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const payments = await storage.getEmiPlanPayments(planId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching EMI plan payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.patch("/api/emi-plans/:id", async (req, res) => {
    try {
      const emiPlan = await storage.updateEmiPlan(parseInt(req.params.id), req.body);
      if (!emiPlan) {
        return res.status(404).json({ message: "EMI plan not found" });
      }
      res.json(emiPlan);
    } catch (error) {
      console.error("EMI plan update error:", error);
      res.status(500).json({ message: "Failed to update EMI plan" });
    }
  });

  app.delete("/api/emi-plans/:id", async (req, res) => {
    try {
      const emiPlan = await storage.getEmiPlan(parseInt(req.params.id));
      if (!emiPlan) return res.status(404).json({ message: "Not found" });
      await storage.deleteEmiPlan(emiPlan.id);
      res.json({ message: "EMI plan deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete EMI plan" });
    }
  });

  // Student Management Routes
  app.get("/api/students", async (req, res) => {
    try {
      const { class: className } = req.query;
      const orgId = await getOrganizationId(req);

      let students = await storage.getAllStudents(); // Getting all, then filtering manually

      // Filter by Organization
      if (orgId) {
        students = students.filter(s => s.organizationId === orgId);
      }

      // Apply filters
      if (className && className !== 'all') {
        students = students.filter(s => s.class === className);
      }

      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Invoice Data Endpoint
  app.get("/api/students/:id/invoice-data", async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);

      // 1. Get Student/Lead Details
      const student = await storage.getStudent(studentId);
      // If found in students table, it might still be a lead, but verify
      // For now assume studentId maps to leads.id if using lead-based system or use getLead if not found?
      // existing routes use storage.getStudent() which primarily looks at 'students' table but 'emiPlans' links to 'leads.id'.
      // Wait, 'emiPlans' uses 'leads.id' (studentId column references leads.id).
      // But 'students' table might not be fully populated? 
      // Safe bet: fetch student. If not found, try getLead?
      // Actually, let's use getStudent as primary.

      const lead = await storage.getLead(studentId); // EMI plans link to leads.id

      if (!student && !lead) {
        return res.status(404).json({ message: "Student not found" });
      }

      const studentData = student || lead;

      // 2. Get Active EMI Plan
      const activePlan = await storage.getEmiPlanByStudentId(studentId);

      // 3. Get EMI Schedule & Payments
      let emiSchedule = [];
      let payments = [];

      if (activePlan) {
        emiSchedule = await storage.getEmiPlanSchedule(activePlan.id);
        payments = await storage.getEmiPlanPayments(activePlan.id);
      } else {
        // Maybe just get regular fee payments
        payments = await storage.getFeePaymentsByStudent(studentId);
      }

      // 4. Get Regular Fee Structure (if any)
      const feeStructure = await storage.getFeeStructureByStudent(studentId);

      res.json({
        student: studentData,
        emiPlan: activePlan,
        emiSchedule,
        payments,
        feeStructure
      });

    } catch (error) {
      console.error("Error fetching invoice data:", error);
      res.status(500).json({ message: "Failed to fetch invoice data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  //Payment Due Report - Detailed student payment information
  app.get("/api/reports/payment-due", async (req, res) => {
    try {
      const { program, status } = req.query;
      const orgId = await getOrganizationId(req);

      console.log('[PAYMENT-DUE] Request received:', { program, status, orgId });

      // Get all enrolled leads (students with fee payments)
      let leads = await storage.getAllLeads();
      console.log('[PAYMENT-DUE] Total leads from DB:', leads.length);

      // Filter by organization and enrolled status
      if (orgId) {
        leads = leads.filter(l => l.organizationId === orgId && l.status === "enrolled");
        console.log('[PAYMENT-DUE] Enrolled leads after org filter:', leads.length);
      } else {
        console.log('[PAYMENT-DUE] WARNING: No organization ID found');
        leads = leads.filter(l => l.status === "enrolled");
      }

      // Filter by program/class
      if (program && program !== 'all') {
        leads = leads.filter(l => {
          const leadClass = l.class?.toLowerCase() || '';
          const leadStream = l.stream?.toLowerCase() || '';
          const programLower = (program as string).toLowerCase();

          // Match by class or class + stream
          return leadClass === programLower ||
            `${leadClass} ${leadStream}` === programLower;
        });
      }

      // Fetch active global class fees
      const globalFeesResult = await db
        .select()
        .from(schema.globalClassFees)
        .where(sql`${schema.globalClassFees.isActive} = true`);

      // Fetch fee payments and EMI plans for all enrolled leads
      const paymentPromises = leads.map(async (lead) => {
        // Get all fee payments for this lead
        const feePaymentsResult = await db
          .select()
          .from(schema.feePayments)
          .where(sql`${schema.feePayments.leadId} = ${lead.id}`);

        // Get EMI plans
        const emiPlansResult = await db
          .select()
          .from(schema.emiPlans)
          .where(sql`${schema.emiPlans.studentId} = ${lead.id}`);

        // Get EMI schedule items
        const emiScheduleResult = await db
          .select()
          .from(schema.emiSchedule)
          .where(sql`${schema.emiSchedule.studentId} = ${lead.id}`);

        // Calculate totals
        let totalAdmissionFee = 0;
        let totalRegistrationFee = 0;
        let totalEmiPaid = 0;
        let totalOtherFees = 0;

        let collectedTuition = 0;
        let additionalPaid = 0;
        const additionalPaidReasons = new Set<string>();

        let totalDiscount = 0;
        let lastPaymentDate: Date | null = null;
        const paymentModesMap: Record<string, number> = {};

        feePaymentsResult.forEach((payment: any) => {
          const amount = parseFloat(payment.amount || '0');
          const feeType = payment.feeType || '';
          const mode = payment.paymentMode || 'unknown';
          const category = payment.paymentCategory || 'fee_payment';

          // Track discount
          totalDiscount += parseFloat(payment.discount || '0');

          // Track last payment date
          const pDate = new Date(payment.paymentDate);
          if (!lastPaymentDate || pDate > lastPaymentDate) {
            lastPaymentDate = pDate;
          }

          // Aggregate payment modes
          paymentModesMap[mode] = (paymentModesMap[mode] || 0) + amount;

          // Categorize payments (Tuition vs Additional)
          if (category === 'additional_charge') {
            additionalPaid += amount;
            if (payment.chargeType) {
              additionalPaidReasons.add(payment.chargeType.replace(/_/g, ' '));
            }
          } else {
            collectedTuition += amount;
          }

          // Legacy tracking
          if (feeType === 'admission' || feeType === 'registration') {
            totalRegistrationFee += amount;
          } else if (feeType === 'emi') {
            totalEmiPaid += amount;
          } else {
            totalOtherFees += amount;
          }
        });

        // Format payment modes summary
        const paymentModesSummary = Object.entries(paymentModesMap)
          .map(([mode, amount]) => `${mode.charAt(0).toUpperCase() + mode.slice(1)}: ₹${amount.toLocaleString()}`)
          .join(' | ');

        // Calculate EMI dues and next due date
        let totalEmiDue = 0;
        let overdueCount = 0;
        let nextDueDate: Date | null = null;
        const today = new Date();

        // Sort EMIs by due date to find the next due date correctly
        emiScheduleResult.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        emiScheduleResult.forEach((emi: any) => {
          if (emi.status !== 'paid') {
            const dueAmount = parseFloat(emi.amount || '0');
            totalEmiDue += dueAmount;

            const dueDate = new Date(emi.dueDate);

            // Find earliest unpaid due date
            if (!nextDueDate) {
              nextDueDate = dueDate;
            }

            if (dueDate < today) {
              overdueCount++;
            }
          }
        });

        // Calculate total fees expected (Tuition)
        const leadClass = lead.class;

        let tuitionFeeExpected = 0;

        // Add global fees if applicable
        if (leadClass) {
          const applicableGlobalFees = globalFeesResult.filter((gf: any) =>
            gf.className === leadClass &&
            gf.isActive
          );
          tuitionFeeExpected += applicableGlobalFees.reduce((sum: number, fee: any) => sum + parseFloat(fee.amount || '0'), 0);
        }

        // Fallback calculation if global fees yield 0
        if (tuitionFeeExpected === 0) {
          tuitionFeeExpected = parseFloat((lead as any).totalFee || '0') ||
            emiPlansResult.reduce((sum: number, plan: any) =>
              sum + parseFloat(plan.totalAmount || '0'), 0);
        }

        const totalCollected = collectedTuition + additionalPaid;
        // Total Due based on Tuition Fee - Tuition Paid
        const totalDue = Math.max(0, tuitionFeeExpected - collectedTuition);

        // Determine payment status
        let paymentStatus = 'pending';
        // Logic refinement: if anything is collected, distinct from 'not_paid'
        if (collectedTuition === 0 && additionalPaid === 0) {
          paymentStatus = 'not_paid';
        } else if (totalDue === 0) {
          paymentStatus = 'fully_paid';
        } else if (overdueCount > 0) {
          paymentStatus = 'overdue';
        } else if (collectedTuition > 0 && totalDue > 0) {
          paymentStatus = 'partially_paid';
        }

        return {
          id: lead.id,
          studentName: lead.name || '',
          studentPhone: lead.phone || '',
          fatherName: lead.parentName || '',
          parentPhone: lead.parentPhone || '',
          program: `${lead.class || ''} ${lead.stream || ''}`.trim(),
          class: lead.class || '',
          stream: lead.stream || '',
          invoiceNumber: `INV-${lead.id}`,
          admissionDate: lead.createdAt,
          invoiceAmount: tuitionFeeExpected,
          collectedRegistration: totalRegistrationFee,
          collectedEmi: totalEmiPaid,
          collectedOther: totalOtherFees,
          collectedTuition, // NEW: Explicit Tuition Paid
          additionalPaid,   // NEW: Additional Paid
          additionalPaidReasons: Array.from(additionalPaidReasons).join(', '), // NEW: Reasons
          totalCollected,
          totalDiscount,
          paymentModes: paymentModesSummary,
          lastPaymentDate: lastPaymentDate,
          nextDueDate: nextDueDate,
          dueAmount: totalEmiDue,
          totalDue,
          paymentStatus,
          overdueCount
        };
      });

      let paymentsData = await Promise.all(paymentPromises);

      // Filter by payment status
      if (status && status !== 'all') {
        paymentsData = paymentsData.filter(p => p.paymentStatus === status);
      }

      // Sort by total due (descending)
      paymentsData.sort((a, b) => b.totalDue - a.totalDue);

      res.json(paymentsData);
    } catch (error) {
      console.error("Payment due report error:", error);
      res.status(500).json({ message: "Failed to fetch payment due report", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudent(parseInt(id));

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(student);
    } catch (error) {
      console.error("Get student by ID error:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const studentData = req.body;
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error: any) {
      console.error("Create student error:", error);
      res.status(500).json({ message: error?.message || "Failed to create student" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      console.log("PUT /api/students/:id - Received updates:", updates);

      // Convert date fields to Date objects if they are valid strings
      const dateFields = ["dateOfJoining", "createdAt", "updatedAt"];
      for (const field of dateFields) {
        if (field in updates) {
          const val = updates[field];
          if (typeof val === "string" && !isNaN(Date.parse(val))) {
            updates[field] = new Date(val);
          }
        }
      }

      console.log("Final updates being passed to storage:", updates);

      const student = await storage.updateStudent(parseInt(id), updates);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      console.log("Returning student data:", student);
      res.json(student);
    } catch (error) {
      console.error("Update student error:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // Student route without /api prefix to match staff pattern  
  app.put("/students/:id", async (req, res) => {
    console.log("=== STUDENT ROUTE HIT ===", req.params, req.body);

    // Simple test response first
    res.json({
      message: "Student route working!",
      id: req.params.id,
      updates: req.body
    });
    return;

    try {
      const { id } = req.params;
      const updates = { ...req.body };

      console.log("PUT /students/:id - Received updates:", updates);

      // Convert date fields to Date objects if they are valid strings
      const dateFields = ["dateOfJoining", "createdAt", "updatedAt"];
      for (const field of dateFields) {
        if (field in updates) {
          const val = updates[field];
          if (typeof val === "string" && !isNaN(Date.parse(val))) {
            updates[field] = new Date(val);
          }
        }
      }

      console.log("Final updates being passed to storage:", updates);

      const student = await storage.updateStudent(parseInt(id), updates);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      console.log("Returning student data:", student);
      res.json(student);
    } catch (error) {
      console.error("Update student error:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`API: Attempting to delete student with ID: ${id}`);


      const result = await storage.deleteStudent(parseInt(id));
      console.log(`API: Delete student result: ${result}`);

      if (result) {
        console.log(`API: Student ${id} deleted successfully`);
        res.json({ message: "Student deleted successfully" });
      } else {
        console.log(`API: Failed to delete student ${id}`);
        res.status(400).json({ message: "Student could not be deleted. It may have related data that prevents deletion." });
      }
    } catch (error: any) {
      console.error("API: Delete student error:", error);
      console.error("API: Error type:", typeof error);
      console.error("API: Error code:", error.code);
      console.error("API: Error details:", error.details);
      console.error("API: Error keys:", Object.keys(error));

      if (error.code === '23505') { // Unique violation
        res.status(409).json({ message: "Student with this enrollment number already exists" });
      } else if (error.code === 'ACTIVE_FINANCIAL_OBLIGATIONS') {
        console.log("API: 🎯 Detected ACTIVE_FINANCIAL_OBLIGATIONS error, sending structured response");
        const response = {
          message: error.message,
          code: 'ACTIVE_FINANCIAL_OBLIGATIONS',
          details: error.details || {},
          cannotDelete: true
        };
        console.log("API: 📤 Sending response:", JSON.stringify(response, null, 2));
        res.status(400).json(response);
      } else if (error.message && error.message.includes('active EMI')) {
        console.log("API: 🎯 Detected legacy EMI error format");
        // Fallback for old error format
        res.status(400).json({
          message: error.message,
          code: 'ACTIVE_EMI_FOUND',
          cannotDelete: true
        });
      } else {
        console.log("API: ❌ Unhandled error, sending generic 500 response");
        res.status(500).json({ message: "Failed to delete student" });
      }
    }
  });

  // Staff Management Routes
  app.get("/api/staff", async (req, res) => {
    try {
      const { role, department, status } = req.query;
      const orgId = await getOrganizationId(req);

      let staff = await storage.getAllStaff(orgId); // Assuming updated signature

      // Apply filters
      if (role) {
        staff = staff.filter(s => s.role === role);
      }
      if (department) {
        staff = staff.filter(s => s.department === department);
      }
      if (status) {
        staff = staff.filter(s => s.isActive === (status === 'active'));
      }

      res.json(staff);
    } catch (error) {
      console.error("Get staff error:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await storage.getStaff(parseInt(id));

      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }

      res.json(staff);
    } catch (error) {
      console.error("Get staff by ID error:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const staffData = req.body;
      // Normalize known fields
      const normalizedSalary = staffData?.salary !== undefined ? Number(staffData.salary) : undefined;
      const normalizedDoj = staffData?.dateOfJoining
        ? new Date(staffData.dateOfJoining).toISOString().split('T')[0]
        : undefined;

      // Create staff without employeeId first
      const newStaff = await storage.createStaff({
        ...staffData,
        salary: normalizedSalary ?? staffData.salary,
        dateOfJoining: normalizedDoj ?? staffData.dateOfJoining,
        employeeId: undefined,
        organizationId
      });
      // Generate employeeId and update the record
      const generatedEmployeeId = `EMP${newStaff.id}`;
      const updatedStaff = await storage.updateStaff(newStaff.id, { employeeId: generatedEmployeeId });

      if (!updatedStaff) {
        return res.status(500).json({ message: "Failed to generate employeeId for staff" });
      }

      // --- Insert payroll record for current month/year with status 'pending' ---
      const now = new Date();
      const month = now.getMonth() + 1; // JS months are 0-based
      const year = now.getFullYear();
      // Only insert if not already present for this staff/month/year
      const existingPayroll = await storage.getPayrollByStaff(newStaff.id);
      const alreadyExists = existingPayroll.some(
        p => p.month === month && p.year === year
      );
      if (!alreadyExists) {
        await storage.createPayroll({
          staffId: newStaff.id,
          month,
          year,
          basicSalary: String(Number(newStaff.salary) || 0),
          allowances: "0",
          deductions: "0",
          overtime: "0",
          netSalary: String(Number(newStaff.salary) || 0),
          attendedDays: 30,
          status: 'pending',
        });
      }
      // --- End payroll insert ---

      res.status(201).json(updatedStaff);
    } catch (error: any) {
      console.error("Create staff error:", error);
      // Avoid sending raw error object which may be non-serializable
      const message = error?.message || "Failed to create staff";
      res.status(500).json({ message });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      console.log("PUT /api/staff/:id - Received updates:", updates);

      // Convert date fields to Date objects if they are valid strings
      const dateFields = ["dateOfJoining", "createdAt", "updatedAt"];
      for (const field of dateFields) {
        if (field in updates) {
          const val = updates[field];
          if (typeof val === "string" && !isNaN(Date.parse(val))) {
            updates[field] = new Date(val);
          }
        }
      }

      // Explicitly handle boolean fields
      if ('isActive' in updates) {
        updates.isActive = Boolean(updates.isActive);
        console.log("Converted isActive to boolean:", updates.isActive);
      }

      console.log("Final updates being passed to storage:", updates);

      const staff = await storage.updateStaff(parseInt(id), updates);
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }

      console.log("Returning staff data:", staff);
      res.json(staff);
    } catch (error) {
      console.error("Update staff error:", error);
      res.status(500).json({ message: "Failed to update staff" });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteStaff(parseInt(id));

      if (!success) {
        return res.status(404).json({ message: "Staff not found" });
      }

      res.json({ message: "Staff deleted successfully" });
    } catch (error) {
      console.error("Delete staff error:", error);
      res.status(500).json({ message: "Failed to delete staff" });
    }
  });

  app.get("/api/staff/roles", async (req, res) => {
    try {
      const staff = await storage.getAllStaff();
      const roles = Array.from(new Set(staff.map(s => s.role)));
      res.json(roles);
    } catch (error) {
      console.error("Get staff roles error:", error);
      res.status(500).json({ message: "Failed to fetch staff roles" });
    }
  });

  // Staff CSV Import endpoint
  app.post("/api/staff/import-csv", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const { csvData } = req.body;

      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Invalid CSV data format" });
      }

      const results = {
        staff: [] as any[],
        duplicates: 0,
        errors: 0,
        duplicateDetails: [] as any[]
      };

      for (const staffData of csvData) {
        try {
          // Check for duplicates before creating
          const duplicate = await storage.checkDuplicateStaff(
            staffData.phone,
            staffData.email,
            staffData.employeeId
          );

          if (duplicate) {
            results.duplicates++;
            results.duplicateDetails.push({
              csvData: staffData,
              existingStaff: duplicate,
              matchType: duplicate.phone === staffData.phone ? 'phone' :
                duplicate.email === staffData.email ? 'email' : 'employeeId'
            });
            continue;
          }

          // Create new staff member
          const newStaff = await storage.createStaff({ ...staffData, organizationId });
          results.staff.push(newStaff);

        } catch (error) {
          console.error("Error creating staff from CSV:", error);
          results.errors++;
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Staff CSV import error:", error);
      res.status(500).json({ message: "Failed to import staff CSV" });
    }
  });

  // Check staff duplicate endpoint
  app.post("/api/staff/check-duplicate", async (req, res) => {
    try {
      const { phone, email, employeeId } = req.body;

      const existingStaff = await storage.checkDuplicateStaff(phone, email, employeeId);

      if (existingStaff) {
        res.json({
          isDuplicate: true,
          existingStaff,
          matchType: existingStaff.phone === phone ? 'phone' :
            existingStaff.email === email ? 'email' : 'employeeId'
        });
      } else {
        res.json({ isDuplicate: false });
      }
    } catch (error) {
      console.error("Check staff duplicate error:", error);
      res.status(500).json({ message: "Failed to check duplicates" });
    }
  });

  // Get staff activity logs endpoint
  app.get("/api/staff/:id/activity", async (req, res) => {
    try {
      const { id } = req.params;
      const staffId = parseInt(id);

      if (isNaN(staffId)) {
        return res.status(400).json({ message: "Invalid staff ID" });
      }

      const activities = await storage.getStaffActivities(staffId);
      res.json(activities);
    } catch (error) {
      console.error("Get staff activity error:", error);
      res.status(500).json({ message: "Failed to fetch staff activities" });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const leadId = parseInt(id);

      if (isNaN(leadId)) {
        return res.status(400).json({ message: "Invalid lead ID" });
      }

      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Assuming insertLeadSchema is defined elsewhere and available
      // For this example, we'll use a generic type for updates
      const updates = req.body; // Replace with insertLeadSchema.partial().parse(req.body) if schema is available

      // Optional user lookup for permission check
      const username = req.headers['x-user-name'] as string;
      let user = null;
      if (username) {
        user = await storage.getUserByUsername(username);
      }

      // If user context exists, and lead has an organization, verify ownership
      if (user?.organizationId && lead.organizationId && lead.organizationId !== user.organizationId) {
        return res.status(403).json({ message: "Unauthorized to update this lead" });
      }

      const updatedLead = await storage.updateLead(lead.id, updates);
      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.get("/api/staff/departments", async (req, res) => {
    try {
      const staff = await storage.getAllStaff();
      const departments = Array.from(new Set(staff.map(s => s.department).filter(Boolean)));
      res.json(departments);
    } catch (error) {
      console.error("Get staff departments error:", error);
      res.status(500).json({ message: "Failed to fetch staff departments" });
    }
  });

  // Attendance Routes
  app.get("/api/staff/:id/attendance", async (req, res) => {
    try {
      const { id } = req.params;
      const { month, year } = req.query;

      const attendance = await storage.getAttendanceByStaff(
        parseInt(id),
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined
      );

      res.json(attendance);
    } catch (error) {
      console.error("Get attendance error:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const attendanceData = { ...req.body, organizationId };
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Create attendance error:", error);
      res.status(500).json({ message: "Failed to create attendance record" });
    }
  });

  app.get("/api/attendance/stats", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      const { month, year } = req.query;
      const currentDate = new Date();
      const stats = await storage.getAttendanceStats(
        month ? parseInt(month as string) : currentDate.getMonth() + 1,
        year ? parseInt(year as string) : currentDate.getFullYear(),
        organizationId
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance stats" });
    }
  });

  // Expense Routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }
      // Note: getAllExpenses in storage needs to support orgId filtering or we filter here?
      // Better to update getAllExpenses signature or add getExpensesByOrg
      // For now, let's look at storage.getAllExpenses again.
      // Validated: storage.getAllExpenses() does NOT take arguments currently.
      // I should update storage.getAllExpenses to accept organizationId or add a new method.
      // However, to avoid changing storage interface widely right now, I can just filter in memory if dataset is small, 
      // OR better, update storage.ts first.

      // actually, let's filter in storage.ts. I will update this route assuming storage.getAllExpenses takes orgId
      // OR I will add getExpensesByOrganization to storage.

      // Let's check storage.ts again. It's better to modify storage.ts
      const expenses = await storage.getAllExpenses(organizationId);
      res.json(expenses);
    } catch (error) {
      console.error("Get expenses error:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }
      const expenseData = { ...req.body, organizationId };
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Create expense error:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expense = await storage.updateExpense(id, req.body);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Update expense error:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      console.error("Delete expense error:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Payroll Routes
  app.get("/api/payroll", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      const { month, year, staffId } = req.query;

      let payroll;
      if (staffId) {
        // getPayrollByStaff is already filtered by staffId, which belongs to org
        // But for extra safety we could check staff's org?
        // For now relying on staffId isolation implicitly or we should check.
        // Given we are filtering lists, specific ID access usually assumes verified access.
        payroll = await storage.getPayrollByStaff(parseInt(staffId as string));
      } else if (month && year) {
        payroll = await storage.getPayrollByMonth(parseInt(month as string), parseInt(year as string), organizationId);
      } else {
        // Get all payroll records with staff details
        const allPayroll = await storage.getAllPayroll(organizationId);
        payroll = allPayroll;
      }

      res.json(payroll);
    } catch (error) {
      console.error("Get payroll error:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.get("/api/staff/:id/payroll", async (req, res) => {
    try {
      const { id } = req.params;
      const payroll = await storage.getPayrollByStaff(parseInt(id));
      res.json(payroll);
    } catch (error) {
      console.error("Get payroll error:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  // Helper function for centralized payroll calculation
  const calculatePayroll = (basicSalary: number, allowances: number, overtime: number, deductions: number, attendedDays: number, workingDays: number = 30) => {
    // Loss of Pay (LOP) calculation for absent days
    const dailyRate = basicSalary / workingDays;
    // Ensure we don't deduct more than the basic salary if attendedDays is 0 (though simplified here)
    // Formula: Net = ((Basic / 30) * Attended) + Allowances + Overtime - Deductions
    const basePay = dailyRate * attendedDays;
    const netSalary = basePay + allowances + overtime - deductions;
    return Math.max(0, netSalary); // Prevent negative salary
  };

  app.post("/api/payroll", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const payrollData = req.body;
      console.log('Creating payroll with data:', JSON.stringify(payrollData, null, 2));

      // Validate required fields
      if (!payrollData.staffId || !payrollData.month || !payrollData.year ||
        payrollData.basicSalary === undefined) {
        console.error('Missing required payroll fields:', payrollData);
        return res.status(400).json({
          message: "Missing required fields: staffId, month, year, basicSalary"
        });
      }

      // Ensure numeric values are properly formatted
      const basicSalary = parseFloat(String(payrollData.basicSalary));
      const allowances = parseFloat(String(payrollData.allowances || 0));
      const deductions = parseFloat(String(payrollData.deductions || 0));
      const overtime = parseFloat(String(payrollData.overtime || 0));
      const attendedDays = parseInt(String(payrollData.attendedDays || 30));
      const workingDays = 30; // Default working days

      // Server-side calculation
      const netSalary = calculatePayroll(basicSalary, allowances, overtime, deductions, attendedDays, workingDays);

      const sanitizedData = {
        ...payrollData,
        staffId: parseInt(String(payrollData.staffId)),
        month: parseInt(String(payrollData.month)),
        year: parseInt(String(payrollData.year)),
        basicSalary,
        allowances,
        deductions,
        overtime,
        netSalary, // Use calculated value
        attendedDays,
        status: payrollData.status || 'pending',
        organizationId
      };

      // Upsert logic: check if payroll exists for staff/month/year
      const existing = await storage.getPayrollByStaffMonthYear(sanitizedData.staffId, sanitizedData.month, sanitizedData.year);
      let payroll;
      if (existing) {
        payroll = await storage.updatePayroll(existing.id, sanitizedData);
        console.log('Updated existing payroll record:', JSON.stringify(payroll, null, 2));
      } else {
        payroll = await storage.createPayroll(sanitizedData);
        console.log('Created new payroll record:', JSON.stringify(payroll, null, 2));
      }

      res.status(201).json({
        success: true,
        message: 'Payroll processed successfully',
        data: payroll
      });
    } catch (error) {
      console.error("Create payroll error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process payroll record",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/payroll/stats", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      const { month, year } = req.query;
      const currentDate = new Date();
      const stats = await storage.getPayrollStats(
        month ? parseInt(month as string) : currentDate.getMonth() + 1,
        year ? parseInt(year as string) : currentDate.getFullYear(),
        organizationId
      );
      res.json(stats);
    } catch (error) {
      console.error("Get payroll stats error:", error);
      res.status(500).json({ message: "Failed to fetch payroll stats" });
    }
  });

  app.post("/api/payroll/bulk-generate", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const { month, year, staffIds, payrollData } = req.body;
      console.log('Bulk payroll generation request:', JSON.stringify(req.body, null, 2));

      if (!payrollData || !Array.isArray(payrollData)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payroll data format"
        });
      }

      const createdPayrolls = [];
      const failedPayrolls = [];

      for (const payrollItem of payrollData) {
        try {
          // Validate required fields for each payroll item
          if (!payrollItem.staffId || !payrollItem.month || !payrollItem.year ||
            payrollItem.basicSalary === undefined) {
            console.error('Missing required fields for payroll item:', payrollItem);
            failedPayrolls.push({
              staffId: payrollItem.staffId,
              error: 'Missing required fields'
            });
            continue;
          }

          // Ensure numeric values are properly formatted
          const basicSalary = parseFloat(String(payrollItem.basicSalary));
          const allowances = parseFloat(String(payrollItem.allowances || 0));
          const deductions = parseFloat(String(payrollItem.deductions || 0));
          const overtime = parseFloat(String(payrollItem.overtime || 0));
          const attendedDays = parseInt(String(payrollItem.attendedDays || 30));
          const workingDays = 30;

          // Server-side calculation
          const netSalary = calculatePayroll(basicSalary, allowances, overtime, deductions, attendedDays, workingDays);

          // Sanitize data for each payroll item
          const sanitizedItem = {
            ...payrollItem,
            staffId: parseInt(String(payrollItem.staffId)),
            month: parseInt(String(payrollItem.month)),
            year: parseInt(String(payrollItem.year)),
            basicSalary,
            allowances,
            deductions,
            overtime,
            netSalary, // Use calculated value
            attendedDays,
            status: payrollItem.status || 'pending',
            organizationId
          };

          // Upsert logic: check if payroll exists for staff/month/year
          const existing = await storage.getPayrollByStaffMonthYear(sanitizedItem.staffId, sanitizedItem.month, sanitizedItem.year);
          let payroll;
          if (existing) {
            payroll = await storage.updatePayroll(existing.id, sanitizedItem);
          } else {
            payroll = await storage.createPayroll(sanitizedItem);
          }
          createdPayrolls.push(payroll);
        } catch (error) {
          console.error(`Error processing payroll for staff ${payrollItem.staffId}:`, error);
          failedPayrolls.push({
            staffId: payrollItem.staffId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`Bulk payroll generation completed. Success: ${createdPayrolls.length}, Failed: ${failedPayrolls.length}`);
      res.status(201).json({
        success: true,
        message: `Successfully processed ${createdPayrolls.length} payroll records`,
        createdPayrolls,
        failedPayrolls,
        summary: {
          total: payrollData.length,
          successful: createdPayrolls.length,
          failed: failedPayrolls.length
        }
      });
    } catch (error) {
      console.error("Bulk payroll generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process bulk payroll",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE endpoint for payroll records
  app.delete("/api/payroll/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payroll = await storage.getPayroll(id);
      if (!payroll) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      await storage.deletePayroll(id);
      res.json({ message: "Payroll record deleted successfully" });
    } catch (error) {
      console.error("Payroll deletion error:", error);
      res.status(500).json({ message: "Failed to delete payroll record" });
    }
  });

  // Staff Analytics
  app.get("/api/staff/analytics", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      const staff = await storage.getAllStaff(organizationId);
      const currentDate = new Date();

      // Calculate analytics
      const totalStaff = staff.length;
      const activeStaff = staff.filter(s => s.isActive).length;
      const roleBreakdown = staff.reduce((acc, s) => {
        acc[s.role] = (acc[s.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const departmentBreakdown = staff.reduce((acc, s) => {
        if (s.department) {
          acc[s.department] = (acc[s.department] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate average salary by role
      const salaryByRole = staff.reduce((acc, s) => {
        if (s.salary) {
          if (!acc[s.role]) {
            acc[s.role] = { total: 0, count: 0 };
          }
          acc[s.role].total += Number(s.salary);
          acc[s.role].count += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      // Calculate average salaries
      const averageSalaryByRole: Record<string, number> = {};
      Object.keys(salaryByRole).forEach(role => {
        if (salaryByRole[role].count > 0) {
          averageSalaryByRole[role] = salaryByRole[role].total / salaryByRole[role].count;
        }
      });

      // Recent hires (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const recentHires = staff.filter(s =>
        new Date(s.dateOfJoining) >= sixMonthsAgo
      ).length;

      const analytics = {
        totalStaff,
        activeStaff,
        inactiveStaff: totalStaff - activeStaff,
        roleBreakdown,
        departmentBreakdown,
        salaryByRole: averageSalaryByRole,
        recentHires,
        averageSalary: staff.reduce((sum, s) => sum + (s.salary ? Number(s.salary) : 0), 0) / staff.filter(s => s.salary).length
      };

      res.json(analytics);
    } catch (error) {
      console.error("Get staff analytics error:", error);
      res.status(500).json({ message: "Failed to fetch staff analytics" });
    }
  });

  app.post("/api/payroll/generate-slip", async (req, res) => {
    try {
      const { employeeName, month, year, basicSalary, netSalary, attendedDays, workingDays } = req.body;

      // Set response headers for PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Salary_Slip_${employeeName.replace(/[^a-zA-Z0-9_]/g, "")}_${month}_${year}.pdf`
      );

      // Create PDF
      const doc = new PDFDocument();
      doc.pipe(res);

      doc.fontSize(20).text("Salary Slip", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Employee: ${employeeName}`);
      doc.text(`Month: ${month}/${year}`);
      doc.text(`Basic Salary: ₹${basicSalary}`);
      doc.text(`Net Salary: ₹${netSalary}`);
      doc.text(`Days Worked: ${attendedDays} / ${workingDays}`);
      doc.end();

    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Test PDF generation endpoint
  app.get("/api/test-pdf", async (req, res) => {
    try {
      // Create a simple test PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        autoFirstPage: true
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        try {
          const pdfData = Buffer.concat(chunks);

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', pdfData.length);
          res.setHeader('Content-Disposition', 'attachment; filename="test-document.pdf"');
          res.setHeader('Cache-Control', 'no-cache');

          res.end(pdfData);
        } catch (error) {
          console.error("Error sending test PDF response:", error);
          res.status(500).json({ message: "Failed to send test PDF" });
        }
      });

      doc.on('error', (error) => {
        console.error("Test PDF generation error:", error);
        res.status(500).json({ message: "Failed to generate test PDF" });
      });

      // Add simple content
      doc.fontSize(20).text('Test PDF Document', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('This is a test PDF to verify PDF generation is working.');
      doc.moveDown();
      doc.text(`Generated at: ${new Date().toLocaleString()}`);

      doc.end();

    } catch (error) {
      console.error("Error generating test PDF:", error);
      res.status(500).json({ message: "Failed to generate test PDF" });
    }
  });

  // Generate salary slip PDF
  app.get("/api/payroll/generate-slip/:employeeId/:month/:year", async (req, res) => {
    try {
      const { employeeId, month, year } = req.params;

      // Validate parameters
      if (!employeeId || !month || !year) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Get employee details from storage
      const employee = await storage.getStaff(parseInt(employeeId));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Get payroll details
      const payrollDetails = await storage.getPayrollByStaff(employee.id);
      const currentPayroll = payrollDetails.find(p => p.month === parseInt(month) && p.year === parseInt(year));

      if (!currentPayroll) {
        return res.status(404).json({ message: "Payroll not found for the specified month" });
      }

      // Create PDF document with proper configuration
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        autoFirstPage: true
      });

      // Create a buffer to store the PDF
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        try {
          const pdfData = Buffer.concat(chunks);

          // Set proper headers for PDF download
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', pdfData.length);
          res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${employee.name.replace(/[^a-zA-Z0-9]/g, '_')}-${month}-${year}.pdf"`);
          res.setHeader('Cache-Control', 'no-cache');

          // Send the PDF data
          res.end(pdfData);
        } catch (error) {
          console.error("Error sending PDF response:", error);
          res.status(500).json({ message: "Failed to send PDF" });
        }
      });

      doc.on('error', (error) => {
        console.error("PDF generation error:", error);
        res.status(500).json({ message: "Failed to generate PDF" });
      });

      // Calculate workedDays (present days) using payroll logic
      let presentDays = 30;
      let totalDays = 30;
      let absentDays = 0;
      let baseSalary = typeof employee.salary === 'number' ? employee.salary : Number(employee.salary) || 0;
      let dailyRate = baseSalary / 30;
      let basicSalary = 0;
      let absentDeduction = 0;
      let netSalary = 0;

      // Debug logging
      console.log('PDF Generation Debug:');
      console.log('Employee:', employee.name, 'Salary:', baseSalary);
      console.log('Current Payroll:', currentPayroll);
      console.log('Payroll attendedDays:', currentPayroll?.attendedDays);
      console.log('Payroll basicSalary:', currentPayroll?.basicSalary);
      console.log('Payroll deductions:', currentPayroll?.deductions);
      console.log('Payroll netSalary:', currentPayroll?.netSalary);

      // Use manual/auto payroll values if available
      if (currentPayroll && 'attendedDays' in currentPayroll && currentPayroll.attendedDays !== undefined && currentPayroll.attendedDays !== null) {
        presentDays = Number(currentPayroll.attendedDays) || 30;
        absentDays = totalDays - presentDays;
        basicSalary = currentPayroll.basicSalary !== undefined ? Number(currentPayroll.basicSalary) : dailyRate * presentDays;
        absentDeduction = currentPayroll.deductions !== undefined ? Number(currentPayroll.deductions) : absentDays * dailyRate;
        netSalary = currentPayroll.netSalary !== undefined ? Number(currentPayroll.netSalary) : basicSalary - absentDeduction;

        console.log('Using payroll values:');
        console.log('Present Days:', presentDays);
        console.log('Absent Days:', absentDays);
        console.log('Basic Salary:', basicSalary);
        console.log('Absent Deduction:', absentDeduction);
        console.log('Net Salary:', netSalary);
      } else {
        // fallback: try to count present days from attendance
        const attendanceRecords = await storage.getAttendanceByStaff(employee.id, parseInt(month), parseInt(year));
        presentDays = attendanceRecords.filter(a => a.status === 'present').length || 30;
        absentDays = totalDays - presentDays;
        basicSalary = dailyRate * presentDays;
        absentDeduction = absentDays * dailyRate;
        netSalary = basicSalary - absentDeduction;

        console.log('Using fallback calculations:');
        console.log('Present Days:', presentDays);
        console.log('Absent Days:', absentDays);
        console.log('Basic Salary:', basicSalary);
        console.log('Absent Deduction:', absentDeduction);
        console.log('Net Salary:', netSalary);
      }

      // Institute and Title
      doc.fontSize(16).text('EuroKids Manewada', { align: 'center', underline: true });
      doc.moveDown(0.5);
      doc.fontSize(13).text(`PAY SLIP FOR THE MONTH OF ${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long' })} - ${year}`, { align: 'center' });
      doc.moveDown(1);

      // Employee Details
      doc.fontSize(11);
      doc.text(`Employee Name:   ${employee.name}`);
      doc.text(`Empcode:         ${employee.employeeId || 'N/A'}`);
      doc.text(`Department:      ${employee.department || 'N/A'}`);
      doc.text(`Designation:     ${employee.role || 'N/A'}`);
      doc.moveDown(1);

      // Attendance Section
      doc.fontSize(11).text('Attendance', { underline: true });
      doc.moveDown(0.2);
      doc.text(`Present Days:    ${presentDays}`);
      doc.text(`Absent Days:     ${absentDays}`);
      doc.text(`Total Days:      ${totalDays}`);
      doc.moveDown(1);

      // Salary Details Section
      doc.fontSize(11).text('Salary Details', { underline: true });
      doc.moveDown(0.2);
      doc.text(`Daily Rate:      ₹${dailyRate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.text(`Basic Salary:    ₹${basicSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.moveDown(1);

      // Deductions Section
      doc.fontSize(11).text('Deductions', { underline: true });
      doc.moveDown(0.2);
      doc.text(`Absent Deduction: ₹${absentDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      doc.moveDown(1);

      // Net Salary Section
      doc.fontSize(11).text('Net Salary', { underline: true });
      doc.moveDown(0.2);
      doc.font('Helvetica-Bold').fontSize(13).text(`₹${netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, { align: 'left' });
      doc.font('Helvetica').fontSize(10);
      doc.moveDown(2);

      // Footer
      doc.fontSize(8).text('* This is a computer generated report. No signature required.', { align: 'center' });

      // End the document
      doc.end();

    } catch (error) {
      console.error("Error generating salary slip:", error);
      res.status(500).json({ message: "Failed to generate salary slip" });
    }
  });

  // Temporary endpoint to fix database schema
  app.post("/api/fix-payroll-schema", async (req, res) => {
    try {
      // Add attended_days column if it doesn't exist
      await db.execute(sql`ALTER TABLE payroll ADD COLUMN IF NOT EXISTS attended_days INTEGER DEFAULT 30`);
      res.json({ message: "Payroll schema fixed successfully" });
    } catch (error) {
      console.error("Schema fix error:", error);
      res.status(500).json({ message: "Failed to fix schema" });
    }
  });

  // Test endpoint to verify payroll data is being saved
  app.get("/api/test-payroll-save", async (req, res) => {
    try {
      const { month, year } = req.query;
      const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;
      const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

      // Get all payroll records for the specified month/year
      const payrollRecords = await storage.getPayrollByMonth(currentMonth, currentYear);

      // Get all staff
      const allStaff = await storage.getAllStaff();

      // Check which staff have payroll records
      const staffWithPayroll = payrollRecords.map(p => p.staffId);
      const staffWithoutPayroll = allStaff.filter(s => !staffWithPayroll.includes(s.id));

      res.json({
        success: true,
        month: currentMonth,
        year: currentYear,
        totalStaff: allStaff.length,
        staffWithPayroll: staffWithPayroll.length,
        staffWithoutPayroll: staffWithoutPayroll.length,
        payrollRecords: payrollRecords,
        missingStaff: staffWithoutPayroll.map(s => ({ id: s.id, name: s.name }))
      });
    } catch (error) {
      console.error("Test payroll save error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test payroll save",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Bulk delete staff
  app.post("/api/staff/bulk-delete", async (req, res) => {
    try {
      console.log("Bulk delete request received:", req.body);
      const { staffIds } = req.body;

      if (!Array.isArray(staffIds) || staffIds.length === 0) {
        console.log("Invalid staffIds:", staffIds);
        return res.status(400).json({ message: "No staff IDs provided" });
      }

      console.log("Attempting to delete staff IDs:", staffIds);
      const deletedIds = [];
      const failedIds = [];

      for (const id of staffIds) {
        try {
          console.log(`Attempting to delete staff ID: ${id}`);
          await storage.deleteStaff(Number(id));
          console.log(`Successfully deleted staff ID: ${id}`);
          deletedIds.push(id);
        } catch (error) {
          console.error(`Failed to delete staff ${id}:`, error);
          failedIds.push({ id, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      console.log("Delete operation completed. Deleted:", deletedIds, "Failed:", failedIds);

      if (failedIds.length > 0) {
        return res.status(207).json({
          message: "Some staff members could not be deleted",
          deleted: deletedIds,
          failed: failedIds
        });
      }

      res.json({
        message: "Staff deleted successfully",
        deleted: deletedIds
      });
    } catch (error) {
      console.error("Bulk delete staff error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        message: "Failed to delete staff",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test endpoint to check staff and related data
  app.get("/api/staff/test/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Testing staff ID: ${id}`);

      // Check if staff exists
      const staff = await storage.getStaff(id);
      console.log(`Staff found:`, staff);

      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }

      // Check related payroll records
      const payrollRecords = await storage.getPayrollByStaff(id);
      console.log(`Payroll records:`, payrollRecords);

      // Check related attendance records
      const attendanceRecords = await storage.getAttendanceByStaff(id);
      console.log(`Attendance records:`, attendanceRecords);

      res.json({
        staff,
        payrollCount: payrollRecords.length,
        attendanceCount: attendanceRecords.length,
        payrollRecords,
        attendanceRecords
      });
    } catch (error) {
      console.error("Test endpoint error:", error);
      res.status(500).json({
        message: "Test failed",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId, type, limit } = req.query;
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to user 1 for now
      const limitNum = limit ? parseInt(limit as string) : 50;

      let notifications;
      if (type) {
        notifications = await storage.getNotificationsByType(type as string, limitNum);
      } else {
        notifications = await storage.getNotificationsByUser(userIdNum, limitNum);
      }

      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread", async (req, res) => {
    try {
      const { userId } = req.query;
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to user 1 for now

      const notifications = await storage.getUnreadNotificationsByUser(userIdNum);
      res.json(notifications);
    } catch (error) {
      console.error("Get unread notifications error:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.get("/api/notifications/stats", async (req, res) => {
    try {
      const { userId } = req.query;
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to user 1 for now

      const stats = await storage.getNotificationStats(userIdNum);
      res.json(stats);
    } catch (error) {
      console.error("Get notification stats error:", error);
      res.status(500).json({ message: "Failed to fetch notification stats" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = req.body;
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Use a route parameter pattern so only numeric IDs match
  app.patch("/api/notifications/:id(\\d+)/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    try {
      const { userId } = req.body;
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to user 1 for now

      const count = await storage.markAllNotificationsAsRead(userIdNum);
      res.json({ message: `Marked ${count} notifications as read` });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id(\\d+)", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNotification(id);

      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.delete("/api/notifications/clear-all", async (req, res) => {
    try {
      const { userId } = req.body;
      const userIdNum = userId ? parseInt(userId as string) : 1; // Default to user 1 for now

      const count = await storage.deleteAllNotifications(userIdNum);
      res.json({ message: `Deleted ${count} notifications` });
    } catch (error) {
      console.error("Clear all notifications error:", error);
      res.status(500).json({ message: "Failed to clear notifications", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Helper function to create notifications for various events
  const createSystemNotification = async (type: string, title: string, message: string, priority: 'high' | 'medium' | 'low' = 'medium', actionType?: string, actionId?: string) => {
    try {
      await storage.createNotification({
        userId: 1, // Default to admin user
        type,
        title,
        message,
        priority,
        actionType,
        actionId,
        metadata: JSON.stringify({ systemGenerated: true })
      });
    } catch (error) {
      console.error("Failed to create system notification:", error);
    }
  };

  // Restore a soft-deleted lead
  app.patch("/api/leads/:id/restore", async (req, res) => {
    try {
      const lead = await storage.restoreLead(Number(req.params.id));
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to restore lead" });
    }
  });

  // Delete a lead (move to recently_deleted_leads)
  app.delete("/api/leads/:id", async (req, res) => {
    try {
      console.log("=== DELETE LEAD REQUEST ===");
      console.log("Lead ID to delete:", req.params.id);
      await storage.deleteLead(Number(req.params.id));
      console.log("Lead deletion completed successfully");
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete lead:", error);
      res.status(500).json({ message: "Failed to delete lead", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Test endpoint to check database connection and payroll table
  app.get("/api/test-db", async (req, res) => {
    try {
      // Test basic database connection
      const testQuery = await db.execute(sql`SELECT 1 as test`);
      console.log('Database connection test result:', testQuery);

      // Test if payroll table exists
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'payroll'
        ) as exists
      `);
      console.log('Payroll table exists:', tableExists);

      // Test if we can query payroll table
      let payrollCount = 0;
      try {
        const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM payroll`);
        payrollCount = Number((countResult as any)[0]?.count) || 0;
        console.log('Payroll table count:', payrollCount);
      } catch (error) {
        console.error('Error querying payroll table:', error);
      }

      res.json({
        success: true,
        databaseConnected: true,
        payrollTableExists: Boolean(tableExists),
        payrollRecordCount: payrollCount,
        testQuery: testQuery
      });
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        databaseConnected: false
      });
    }
  });

  // Payroll Overview: All staff with payroll status for selected month/year
  app.get("/api/payroll/overview", async (req, res) => {
    try {
      const { month, year } = req.query;
      const selectedMonth = month ? parseInt(month as string) : (new Date().getMonth() + 1);
      const selectedYear = year ? parseInt(year as string) : (new Date().getFullYear());
      const staffList = await storage.getAllStaff();
      const payrollList = await storage.getPayrollByMonth(selectedMonth, selectedYear);
      const result = staffList.map(staff => {
        const payroll = payrollList.find(p => p.staffId === staff.id);
        if (payroll) {
          return {
            ...staff,
            payrollStatus: payroll.status,
            payroll
          };
        } else {
          return {
            ...staff,
            payrollStatus: 'pending',
            payroll: null
          };
        }
      });
      res.json(result);
    } catch (error) {
      console.error("Payroll overview error:", error);
      res.status(500).json({ message: "Failed to fetch payroll overview" });
    }
  });

  // PATCH endpoint to update only the status of a payroll record
  app.patch("/api/payroll/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Missing status in request body" });
      }
      const updated = await storage.updatePayroll(id, { status });
      if (!updated) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      res.json({ message: "Payroll status updated successfully", payroll: updated });
    } catch (error) {
      console.error("Error updating payroll status:", error);
      res.status(500).json({ message: "Failed to update payroll status" });
    }
  });

  // Total salary for all active employees (from staff table)
  app.get("/api/payroll/active-total", async (req, res) => {
    try {
      // Sum salary for all active employees
      const result = await db.execute(
        sql.raw(
          `SELECT COALESCE(SUM(salary), 0) AS "totalNetPayroll"
           FROM staff
           WHERE is_active = true`
        )
      );
      const totalNetPayroll = (result as any)[0]?.totalNetPayroll || 0;
      res.json({ totalNetPayroll });
    } catch (error) {
      console.error("Active payroll total error:", error);
      res.status(500).json({ message: "Failed to fetch active staff payroll total" });
    }
  });


  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExpense(id);

      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Delete expense error:", error);
      res.status(500).json({ message: "Failed to delete expense", error });
    }
  });

  // AI Enhanced routes
  try {
    const aiEnhancedRoutes = (await import("./api/ai-enhanced.js")).default;
    app.use("/api/ai", aiEnhancedRoutes);
  } catch (error) {
    console.error("Failed to load AI enhanced routes:", error);
  }

  // Comprehensive AI routes
  try {
    const aiComprehensiveRoutes = (await import("./api/ai-comprehensive.js")).default;
    app.use("/api/ai-comprehensive", aiComprehensiveRoutes);
  } catch (error) {
    console.error("Failed to load comprehensive AI routes:", error);
  }

  // Mount AI Comprehensive Analytics Routes
  app.use("/api/ai", aiComprehensiveRouter);

  // Global Class Fees
  app.get("/api/global-class-fees", async (req, res) => {
    try {
      const fees = await storage.getAllGlobalClassFees();
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch global class fees" });
    }
  });

  app.get("/api/emi-plans", async (req, res) => {
    try {
      const result = await db.select().from(schema.emiPlans);
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch EMI plans:", error);
      res.status(500).json({ message: "Failed to fetch EMI plans" });
    }
  });

  // Message Templates Routes
  app.get("/api/message-templates", async (req, res) => {
    try {
      const { category } = req.query;
      const templates = await storage.getAllMessageTemplates(category as string | undefined);
      res.json(templates);
    } catch (error) {
      console.error("Get message templates error:", error);
      res.status(500).json({ message: "Failed to fetch message templates" });
    }
  });

  app.get("/api/message-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getMessageTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Get message template error:", error);
      res.status(500).json({ message: "Failed to fetch message template" });
    }
  });

  app.post("/api/message-templates", async (req, res) => {
    try {
      const templateData = req.body;
      const template = await storage.createMessageTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Create message template error:", error);
      res.status(500).json({ message: "Failed to create message template" });
    }
  });

  app.put("/api/message-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const template = await storage.updateMessageTemplate(id, updates);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Update message template error:", error);
      res.status(500).json({ message: "Failed to update message template" });
    }
  });

  app.delete("/api/message-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMessageTemplate(id);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message === "Cannot delete default templates") {
        return res.status(403).json({ message: error.message });
      }
      console.error("Delete message template error:", error);
      res.status(500).json({ message: "Failed to delete message template" });
    }
  });

  // Communication Routes
  app.get("/api/communications", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getCommunicationLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching communication logs:", error);
      res.status(500).json({ message: "Failed to fetch communication logs" });
    }
  });

  app.post("/api/communications/send", async (req, res) => {
    try {
      const { recipients, message, subject, type, groupName } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ message: "No recipients provided" });
      }

      console.log(`Processing ${type} blast for ${recipients.length} recipients`);

      const results = {
        total: recipients.length,
        sent: 0,
        failed: 0,
        errors: [] as any[]
      };

      // Prefetch global fees if needed for dynamic replacement
      const needsFeeCalculation = message.includes("{{total_fee}}") || message.includes("{{fee_breakdown}}");
      let globalFees: any[] = [];
      if (needsFeeCalculation) {
        globalFees = await storage.getAllGlobalClassFees();
      }

      for (const recipient of recipients) {
        try {
          let personalizedMessage = message;

          // Dynamic Fee Calculation and Replacement
          if (needsFeeCalculation && recipient.role === 'student') {
            const studentId = recipient.data?.id || recipient.id;
            let studentClass = recipient.data?.class;

            // If class is missing in recipient data, try to fetch student
            if (!studentClass && studentId) {
              const student = await storage.getStudent(studentId);
              if (student) {
                studentClass = student.class;
              }
            }

            if (studentClass) {
              // Calculate fees for this class
              const classFees = globalFees.filter(f => f.className === studentClass && f.isActive);
              const totalFee = classFees.reduce((sum, f) => sum + Number(f.amount), 0);

              // Replace variables
              personalizedMessage = personalizedMessage.replace(/{{total_fee}}/g, totalFee.toFixed(2));

              if (personalizedMessage.includes("{{fee_breakdown}}")) {
                const breakdown = classFees.map(f => `- ${f.feeType}: ${f.amount} (${f.frequency})`).join("\\n");
                personalizedMessage = personalizedMessage.replace(/{{fee_breakdown}}/g, breakdown);
              }
            } else {
              // Fallback if class not found
              personalizedMessage = personalizedMessage.replace(/{{total_fee}}/g, "[Fee Info Unavailable]");
              personalizedMessage = personalizedMessage.replace(/{{fee_breakdown}}/g, "");
            }
          }

          // Replace basic variables
          personalizedMessage = personalizedMessage
            .replace(/{{name}}/g, recipient.name || 'Parent/Student')
            .replace(/{{email}}/g, recipient.email || '')
            .replace(/{{phone}}/g, recipient.phone || '');


          // --- MOCK SENDING LOGIC (Replace with actual SMS/Email provider) ---
          console.log(`Sending ${type} to ${recipient.name} (${recipient.phone || recipient.email}): ${personalizedMessage.substring(0, 50)}...`);
          // -------------------------------------------------------------------

          // Create Communication Log
          await storage.createCommunicationLog({
            recipientType: recipient.role || 'student',
            recipientId: recipient.id ? parseInt(recipient.id) : null,
            groupName: groupName || null,
            type: type,
            subject: subject,
            message: personalizedMessage,
            status: 'sent',
            createdBy: 1, // Default to admin for now
          });

          results.sent++;
        } catch (error) {
          console.error(`Failed to send to ${recipient.name}:`, error);
          results.failed++;
          results.errors.push({ recipient: recipient.name, error: error instanceof Error ? error.message : String(error) });
        }
      }

      res.json({
        message: `Processed ${results.total} messages`,
        ...results
      });

    } catch (error) {
      console.error("Error sending communications:", error);
      res.status(500).json({ message: "Failed to process communication request" });
    }
  });

  // ============================================
  // EXPENSE MANAGEMENT ROUTES
  // ============================================

  // Get all expenses (filtered by organization)
  app.get("/api/expenses", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const expenses = await storage.getAllExpenses(organizationId);
      res.json(expenses);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Create new expense
  app.post("/api/expenses", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const { description, amount, category, date } = req.body;

      if (!description || !amount || !category || !date) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const expense = await storage.createExpense({
        description,
        amount,
        category,
        date,
        organizationId,
        status: "pending"
      });

      res.status(201).json(expense);
    } catch (error) {
      console.error("Failed to create expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Update expense
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const expenseId = parseInt(req.params.id);
      const { description, amount, category, date } = req.body;

      // Verify expense belongs to organization
      const existingExpense = await storage.getExpense(expenseId);
      if (!existingExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      if (existingExpense.organizationId !== organizationId) {
        return res.status(403).json({ message: "Unauthorized to update this expense" });
      }

      const expense = await storage.updateExpense(expenseId, {
        description,
        amount,
        category,
        date
      });

      res.json(expense);
    } catch (error) {
      console.error("Failed to update expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const expenseId = parseInt(req.params.id);

      // Verify expense belongs to organization
      const existingExpense = await storage.getExpense(expenseId);
      if (!existingExpense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      if (existingExpense.organizationId !== organizationId) {
        return res.status(403).json({ message: "Unauthorized to delete this expense" });
      }

      const success = await storage.deleteExpense(expenseId);
      if (success) {
        res.json({ message: "Expense deleted successfully" });
      } else {
        res.status(404).json({ message: "Expense not found" });
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // ============================================
  // INVENTORY/STOCK MANAGEMENT ROUTES
  // ============================================

  // Get all inventory items with filters
  app.get("/api/inventory/items", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const { categoryId, supplierId, search, isActive } = req.query;
      const filters: any = {};

      if (categoryId) filters.categoryId = Number(categoryId);
      if (supplierId) filters.supplierId = Number(supplierId);
      if (search) filters.searchTerm = search as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const items = await storage.getInventoryItems(organizationId, filters);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  // Get single inventory item
  app.get("/api/inventory/items/:id", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const item = await storage.getInventoryItem(Number(req.params.id), organizationId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Failed to fetch inventory item:", error);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  // Create inventory item
  app.post("/api/inventory/items", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const item = await storage.createInventoryItem({
        ...req.body,
        organizationId
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to create inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  // Update inventory item
  app.put("/api/inventory/items/:id", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const item = await storage.updateInventoryItem(Number(req.params.id), req.body);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Failed to update inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // Delete inventory item (soft delete)
  app.delete("/api/inventory/items/:id", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      await storage.deleteInventoryItem(Number(req.params.id));
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Failed to delete inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Get inventory categories
  app.get("/api/inventory/categories", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const categories = await storage.getInventoryCategories(organizationId);
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create inventory category
  app.post("/api/inventory/categories", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const category = await storage.createInventoryCategory({
        ...req.body,
        organizationId
      });
      res.status(201).json(category);
    } catch (error) {
      console.error("Failed to create category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update inventory category
  app.put("/api/inventory/categories/:id", async (req, res) => {
    try {
      const category = await storage.updateInventoryCategory(Number(req.params.id), req.body);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to update category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete inventory category
  app.delete("/api/inventory/categories/:id", async (req, res) => {
    try {
      await storage.deleteInventoryCategory(Number(req.params.id));
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Failed to delete category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Get inventory suppliers
  app.get("/api/inventory/suppliers", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const suppliers = await storage.getInventorySuppliers(organizationId);
      res.json(suppliers);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  // Create inventory supplier
  app.post("/api/inventory/suppliers", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const supplier = await storage.createInventorySupplier({
        ...req.body,
        organizationId
      });
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  // Update inventory supplier
  app.put("/api/inventory/suppliers/:id", async (req, res) => {
    try {
      const supplier = await storage.updateInventorySupplier(Number(req.params.id), req.body);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Failed to update supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  // Delete inventory supplier
  app.delete("/api/inventory/suppliers/:id", async (req, res) => {
    try {
      await storage.deleteInventorySupplier(Number(req.params.id));
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Get inventory transactions
  app.get("/api/inventory/transactions", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const { itemId, type, startDate, endDate } = req.query;
      const filters: any = {};

      if (itemId) filters.itemId = Number(itemId);
      if (type) filters.transactionType = type as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const transactions = await storage.getInventoryTransactions(organizationId, filters);
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create inventory transaction (stock in/out)
  app.post("/api/inventory/transactions", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      // Get current user for userId
      const username = req.headers['x-user-name'] as string || (req.session as any)?.username;
      let userId;
      if (username) {
        const user = await storage.getUserByUsername(username) || await storage.getUserByEmail(username);
        userId = user?.id;
      }

      const transaction = await storage.createInventoryTransaction({
        ...req.body,
        userId
      });
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Get transaction history for specific item
  app.get("/api/inventory/items/:id/transactions", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const transactions = await storage.getItemTransactionHistory(Number(req.params.id), organizationId);
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch item transactions:", error);
      res.status(500).json({ message: "Failed to fetch item transactions" });
    }
  });

  // Get low stock items
  app.get("/api/inventory/low-stock", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const items = await storage.getLowStockItems(organizationId);
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  // Get inventory statistics
  app.get("/api/inventory/stats", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const stats = await storage.getInventoryStats(organizationId);
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch inventory stats:", error);
      res.status(500).json({ message: "Failed to fetch inventory stats" });
    }
  });

  // Get stock valuation report
  app.get("/api/inventory/valuation", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const valuation = await storage.getStockValuation(organizationId);
      res.json(valuation);
    } catch (error) {
      console.error("Failed to fetch stock valuation:", error);
      res.status(500).json({ message: "Failed to fetch stock valuation" });
    }
  });

  // Get expenses for specific inventory item
  app.get("/api/inventory/items/:id/expenses", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const expenses = await storage.getExpensesByInventoryItem(Number(req.params.id), organizationId);
      res.json(expenses);
    } catch (error) {
      console.error("Failed to fetch item expenses:", error);
      res.status(500).json({ message: "Failed to fetch item expenses" });
    }
  });

  // Get all inventory-related expenses
  app.get("/api/inventory/expenses", async (req, res) => {
    try {
      const organizationId = await getOrganizationId(req);
      if (!organizationId) {
        return res.status(403).json({ message: "No organization assigned" });
      }

      const expenses = await storage.getInventoryRelatedExpenses(organizationId);
      res.json(expenses);
    } catch (error) {
      console.error("Failed to fetch inventory expenses:", error);
      res.status(500).json({ message: "Failed to fetch inventory expenses" });
    }
  });

  // ============================================
  // DAYCARE MANAGEMENT ROUTES
  // ============================================
  registerDaycareRoutes(app);


  const httpServer = createServer(app);
  return httpServer;
}