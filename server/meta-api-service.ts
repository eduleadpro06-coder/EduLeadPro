/**
 * Meta (Facebook/Instagram) Marketing API Service
 * Handles authentication, campaign management, ad management, and lead retrieval
 */

interface MetaConfig {
    appId: string;
    appSecret: string;
    redirectUri: string;
    apiVersion: string;
}

interface MetaCampaignData {
    name: string;
    objective: string;
    status?: string;
    dailyBudget?: number;
    lifetimeBudget?: number;
    startTime?: string;
    endTime?: string;
}

interface MetaAdSetData {
    name: string;
    campaignId: string;
    targeting?: any;
    bidAmount?: number;
    optimizationGoal?: string;
    billingEvent?: string;
}

interface MetaAdData {
    name: string;
    adSetId: string;
    creative: any;
}

interface MetaLeadFormData {
    name: string;
    questions: any[];
    privacyPolicyUrl?: string;
}

class MetaAPIService {
    private config: MetaConfig;
    private baseUrl = "https://graph.facebook.com";

    constructor() {
        this.config = {
            appId: process.env.META_APP_ID || "",
            appSecret: process.env.META_APP_SECRET || "",
            redirectUri: process.env.META_REDIRECT_URI || "",
            apiVersion: "v18.0", // Update as needed
        };

        if (!this.config.appId || !this.config.appSecret) {
            console.warn("[Meta API] Missing Meta App credentials. Meta Marketing features will not work.");
        }
    }

    /**
     * Generate OAuth authorization URL for user to connect their Meta account
     */
    generateOAuthUrl(state?: string): string {
        const permissions = [
            "ads_management",
            "ads_read",
            "leads_retrieval",
            "pages_read_engagement",
            "pages_manage_ads",
        ].join(",");

        const params = new URLSearchParams({
            client_id: this.config.appId,
            redirect_uri: this.config.redirectUri,
            scope: permissions,
            response_type: "code",
            state: state || "",
        });

        return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code: string): Promise<{
        accessToken: string;
        expiresIn: number;
        tokenType: string;
    }> {
        const params = new URLSearchParams({
            client_id: this.config.appId,
            client_secret: this.config.appSecret,
            redirect_uri: this.config.redirectUri,
            code,
        });

        const response = await fetch(`${this.baseUrl}/${this.config.apiVersion}/oauth/access_token?${params.toString()}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Meta OAuth error: ${error.error?.message || "Unknown error"}`);
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            expiresIn: data.expires_in || 5184000, // Default 60 days
            tokenType: data.token_type || "bearer",
        };
    }

    /**
     * Get long-lived access token (60 days)
     */
    async getLongLivedToken(shortLivedToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }> {
        const params = new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: this.config.appId,
            client_secret: this.config.appSecret,
            fb_exchange_token: shortLivedToken,
        });

        const response = await fetch(`${this.baseUrl}/${this.config.apiVersion}/oauth/access_token?${params.toString()}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Token exchange error: ${error.error?.message || "Unknown error"}`);
        }

        const data = await response.json();
        return {
            accessToken: data.access_token,
            expiresIn: data.expires_in,
        };
    }

    /**
     * Get user's ad accounts
     */
    async getAdAccounts(accessToken: string): Promise<any[]> {
        const response = await fetch(
            `${this.baseUrl}/${this.config.apiVersion}/me/adaccounts?fields=id,name,account_id,account_status&access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch ad accounts");
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get user's Facebook pages
     */
    async getPages(accessToken: string): Promise<any[]> {
        const response = await fetch(
            `${this.baseUrl}/${this.config.apiVersion}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch pages");
        }

        const data = await response.json();
        return data.data || [];
    }

    // ========== Campaign Management ==========

    /**
     * Create a new campaign
     */
    async createCampaign(
        adAccountId: string,
        accessToken: string,
        campaignData: MetaCampaignData
    ): Promise<any> {
        const body: any = {
            name: campaignData.name,
            objective: campaignData.objective,
            status: campaignData.status || "PAUSED",
            access_token: accessToken,
        };

        if (campaignData.dailyBudget) {
            body.daily_budget = Math.round(campaignData.dailyBudget * 100); // Convert to cents
        }

        if (campaignData.lifetimeBudget) {
            body.lifetime_budget = Math.round(campaignData.lifetimeBudget * 100);
        }

        const response = await fetch(`${this.baseUrl}/${this.config.apiVersion}/${adAccountId}/campaigns`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Create campaign error: ${error.error?.message || "Unknown error"}`);
        }

        return response.json();
    }

    /**
     * Get campaigns for an ad account
     */
    async getCampaigns(adAccountId: string, accessToken: string): Promise<any[]> {
        const fields = "id,name,objective,status,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time";
        const response = await fetch(
            `${this.baseUrl}/${this.config.apiVersion}/${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch campaigns");
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Update a campaign
     */
    async updateCampaign(
        campaignId: string,
        accessToken: string,
        updates: Partial<MetaCampaignData>
    ): Promise<any> {
        const body: any = { access_token: accessToken };

        if (updates.name) body.name = updates.name;
        if (updates.status) body.status = updates.status;
        if (updates.dailyBudget) body.daily_budget = Math.round(updates.dailyBudget * 100);

        const response = await fetch(`${this.baseUrl}/${this.config.apiVersion}/${campaignId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Update campaign error: ${error.error?.message || "Unknown error"}`);
        }

        return response.json();
    }

    /**
     * Delete a campaign
     */
    async deleteCampaign(campaignId: string, accessToken: string): Promise<boolean> {
        const response = await fetch(
            `${this.baseUrl}/${this.config.apiVersion}/${campaignId}?access_token=${accessToken}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error("Failed to delete campaign");
        }

        const data = await response.json();
        return data.success === true;
    }

    /**
     * Get campaign insights (performance metrics)
     */
    async getCampaignInsights(campaignId: string, accessToken: string): Promise<any> {
        const fields = "impressions,reach,clicks,ctr,spend,cost_per_result,results";
        const response = await fetch(
            `${this.baseUrl}/${this.config.apiVersion}/${campaignId}/insights?fields=${fields}&access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch campaign insights");
        }

        const data = await response.json();
        return data.data?.[0] || {};
    }

    // ========== Lead Form Management ==========

    /**
     * Create a lead generation form
     */
    async createLeadForm(pageId: string, accessToken: string, formData: MetaLeadFormData): Promise<any> {
        const body = {
            name: formData.name,
            questions: JSON.stringify(formData.questions),
            privacy_policy_url: formData.privacyPolicyUrl,
            access_token: accessToken,
        };

        const response = await fetch(`${this.baseUrl}/${this.config.apiVersion}/${pageId}/leadgen_forms`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Create lead form error: ${error.error?.message || "Unknown error"}`);
        }

        return response.json();
    }

    /**
     * Get lead forms for a page
     */
    async getLeadForms(pageId: string, accessToken: string): Promise<any[]> {
        const response = await fetch(
            `${this.baseUrl}/${this.config.apiVersion}/${pageId}/leadgen_forms?access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch lead forms");
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get leads from a specific form
     */
    async getLeadsFromForm(formId: string, accessToken: string): Promise<any[]> {
        const response = await fetch(
            `${this.baseUrl}/${this.config.apiVersion}/${formId}/leads?access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch leads from form");
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get lead details
     */
    async getLeadDetails(leadId: string, accessToken: string): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/${this.config.apiVersion}/${leadId}?access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch lead details");
        }

        return response.json();
    }

    // ========== Error Handling & Utilities ==========

    /**
     * Handle API errors with retry logic
     */
    async retryWithBackoff<T>(
        fn: () => Promise<T>,
        maxRetries = 3,
        delay = 1000
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;
                if (i < maxRetries - 1) {
                    await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }

        throw lastError;
    }

    /**
     * Rate limiter (simple implementation)
     */
    private lastRequestTime = 0;
    private minRequestInterval = 100; // 100ms between requests

    async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;

        if (elapsed < this.minRequestInterval) {
            await new Promise((resolve) => setTimeout(resolve, this.minRequestInterval - elapsed));
        }

        this.lastRequestTime = Date.now();
        return fn();
    }
}

// Export singleton instance
export const metaAPIService = new MetaAPIService();
