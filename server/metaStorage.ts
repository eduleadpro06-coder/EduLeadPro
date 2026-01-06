/**
 * Meta Marketing Storage Module
 * Handles all database operations for Meta (Facebook/Instagram) marketing integration
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db.js";
import * as schema from "../shared/schema.js";

export const metaStorage = {
    // ========== Meta Connections ==========

    async createConnection(data: {
        organizationId: number;
        accessToken: string;
        tokenExpiresAt: Date;
        refreshToken?: string;
        adAccountId: string;
        pageId?: string;
        pageName?: string;
    }) {
        const result = await db.insert(schema.metaConnections).values(data).returning();
        return result[0];
    },

    async getConnection(organizationId: number) {
        const result = await db
            .select()
            .from(schema.metaConnections)
            .where(
                and(
                    eq(schema.metaConnections.organizationId, organizationId),
                    eq(schema.metaConnections.isActive, true)
                )
            )
            .limit(1);
        return result[0];
    },

    async updateConnection(id: number, updates: any) {
        const result = await db
            .update(schema.metaConnections)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.metaConnections.id, id))
            .returning();
        return result[0];
    },

    async deleteConnection(organizationId: number) {
        await db
            .update(schema.metaConnections)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(schema.metaConnections.organizationId, organizationId));
        return true;
    },

    // ========== Meta Campaigns ==========

    async createCampaign(data: {
        organizationId: number;
        metaCampaignId: string;
        name: string;
        objective: string;
        status?: string;
        dailyBudget?: number;
        lifetimeBudget?: number;
        startTime?: Date;
        endTime?: Date;
    }) {
        const result = await db.insert(schema.metaCampaigns).values(data).returning();
        return result[0];
    },

    async getCampaigns(organizationId: number) {
        return await db
            .select()
            .from(schema.metaCampaigns)
            .where(eq(schema.metaCampaigns.organizationId, organizationId))
            .orderBy(desc(schema.metaCampaigns.createdAt));
    },

    async getCampaign(id: number) {
        const result = await db
            .select()
            .from(schema.metaCampaigns)
            .where(eq(schema.metaCampaigns.id, id))
            .limit(1);
        return result[0];
    },

    async updateCampaign(id: number, updates: any) {
        const result = await db
            .update(schema.metaCampaigns)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.metaCampaigns.id, id))
            .returning();
        return result[0];
    },

    async deleteCampaign(id: number) {
        await db.delete(schema.metaCampaigns).where(eq(schema.metaCampaigns.id, id));
        return true;
    },

    // ========== Meta Ad Sets ==========

    async createAdSet(data: {
        organizationId: number;
        campaignId: number;
        metaAdSetId: string;
        name: string;
        targeting?: any;
        bidAmount?: number;
        optimizationGoal?: string;
        billingEvent?: string;
        status?: string;
    }) {
        const result = await db.insert(schema.metaAdSets).values(data).returning();
        return result[0];
    },

    async getAdSets(campaignId: number) {
        return await db
            .select()
            .from(schema.metaAdSets)
            .where(eq(schema.metaAdSets.campaignId, campaignId))
            .orderBy(desc(schema.metaAdSets.createdAt));
    },

    async updateAdSet(id: number, updates: any) {
        const result = await db
            .update(schema.metaAdSets)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(schema.metaAdSets.id, id))
            .returning();
        return result[0];
    },

    async deleteAdSet(id: number) {
        await db.delete(schema.metaAdSets).where(eq(schema.metaAdSets.id, id));
        return true;
    },

    // ========== Meta Ads ==========

    async createAd(data: {
        organizationId: number;
        adSetId: number;
        metaAdId: string;
        name: string;
        creative: any;
        status?: string;
    }) {
        const result = await db.insert(schema.metaAds).values(data).returning();
        return result[0];
    },

    async getAds(adSetId: number) {
        return await db
            .select()
            .from(schema.metaAds)
            .where(eq(schema.metaAds.adSetId, adSetId))
            .orderBy(desc(schema.metaAds.createdAt));
    },

    // ========== Meta Lead Forms ==========

    async createLeadForm(data: {
        organizationId: number;
        metaFormId: string;
        name: string;
        questions: any;
        privacyPolicyUrl?: string;
    }) {
        const result = await db.insert(schema.metaLeadForms).values(data).returning();
        return result[0];
    },

    async getLeadForms(organizationId: number) {
        return await db
            .select()
            .from(schema.metaLeadForms)
            .where(eq(schema.metaLeadForms.organizationId, organizationId))
            .orderBy(desc(schema.metaLeadForms.createdAt));
    },

    // ========== Meta Synced Leads ==========

    async createSyncedLead(data: {
        organizationId: number;
        metaLeadId: string;
        crmLeadId: number;
        formId?: number;
        campaignId?: number;
        adId?: number;
        rawData: any;
    }) {
        const result = await db.insert(schema.metaSyncedLeads).values(data).returning();
        return result[0];
    },

    async getSyncedLeads(organizationId: number, limit = 50) {
        return await db
            .select()
            .from(schema.metaSyncedLeads)
            .where(eq(schema.metaSyncedLeads.organizationId, organizationId))
            .orderBy(desc(schema.metaSyncedLeads.syncedAt))
            .limit(limit);
    },

    async checkLeadExists(metaLeadId: string, organizationId: number) {
        const result = await db
            .select()
            .from(schema.metaSyncedLeads)
            .where(
                and(
                    eq(schema.metaSyncedLeads.metaLeadId, metaLeadId),
                    eq(schema.metaSyncedLeads.organizationId, organizationId)
                )
            )
            .limit(1);
        return result.length > 0;
    },
};
