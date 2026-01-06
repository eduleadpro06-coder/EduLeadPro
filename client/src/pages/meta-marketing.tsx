import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
    Facebook,
    Instagram,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Users,
    Target,
    Plus,
    RefreshCw,
    ExternalLink,
    Play,
    Pause,
    Trash2,
    Eye,
    BarChart3,
    Zap,
    AlertCircle,
    Clock,
    Download,
} from "lucide-react";

interface MetaConnection {
    id: number;
    adAccountId: string;
    pageId?: string;
    pageName?: string;
    isActive: boolean;
    tokenExpiresAt: string;
}

interface MetaCampaign {
    id: number;
    metaCampaignId: string;
    name: string;
    objective: string;
    status: string;
    dailyBudget?: number;
    lifetimeBudget?: number;
    startTime?: string;
    endTime?: string;
}

export default function MetaMarketing() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("overview");
    const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Fetch Meta connection status
    const { data: connection, isLoading: connectionLoading } = useQuery<MetaConnection>({
        queryKey: ["/api/meta/connection/status"],
    });

    // Fetch campaigns
    const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<MetaCampaign[]>({
        queryKey: ["/api/meta/campaigns"],
        enabled: !!connection?.isActive,
    });

    // OAuth connection handler
    const handleConnectMeta = () => {
        window.location.href = "/api/meta/oauth/authorize";
    };

    // Disconnect handler
    const disconnectMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("DELETE", "/api/meta/oauth/disconnect");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/meta/connection/status"] });
            toast({ title: "Meta account disconnected successfully" });
        },
        onError: () => {
            toast({ title: "Failed to disconnect account", variant: "destructive" });
        },
    });

    // Manual sync handler
    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            const response = await apiRequest("POST", "/api/meta/leads/sync");
            const result = await response.json();
            toast({
                title: "Leads synced successfully",
                description: `Synced ${result.count || 0} new leads`
            });
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        } catch (error) {
            toast({ title: "Failed to sync leads", variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

    const isConnected = connection?.isActive;

    return (
        <div className="p-8 space-y-8">
            {/* Page Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Facebook className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Meta Marketing</h1>
                        <p className="text-gray-600">Manage your Facebook & Instagram advertising campaigns</p>
                    </div>
                </div>
            </div>

            {/* Connection Status Card */}
            <Card className="border-2 border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span>Meta Account Status</span>
                        </div>
                        {isConnected ? (
                            <Badge variant="default" className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-gray-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Connected
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {connectionLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                        </div>
                    ) : isConnected ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">Facebook Page</div>
                                    <div className="font-semibold text-gray-900 flex items-center">
                                        <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                                        {connection.pageName || "Not Connected"}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">Ad Account ID</div>
                                    <div className="font-semibold text-gray-900 font-mono text-sm">
                                        {connection.adAccountId}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-sm text-gray-600">
                                    Token expires: {new Date(connection.tokenExpiresAt).toLocaleDateString()}
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => disconnectMutation.mutate()}
                                    disabled={disconnectMutation.isPending}
                                >
                                    Disconnect Account
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                    <Facebook className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Connect Your Meta Account
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto mb-6">
                                    Before connecting, you need to configure your Meta App credentials.
                                </p>
                            </div>

                            {/* Setup Steps */}
                            <div className="max-w-2xl mx-auto mb-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-left">
                                    <div className="flex items-start gap-3 mb-4">
                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-amber-900 mb-2">
                                                Quick Setup Required (5 minutes)
                                            </h4>
                                            <p className="text-sm text-amber-800 mb-4">
                                                Follow these simple steps to get started:
                                            </p>
                                            <ol className="text-sm text-amber-900 space-y-3 ml-1">
                                                <li className="flex gap-2">
                                                    <span className="font-semibold min-w-[20px]">1.</span>
                                                    <span>
                                                        Create a Meta App at{" "}
                                                        <a
                                                            href="https://developers.facebook.com/"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="underline hover:text-amber-700"
                                                        >
                                                            developers.facebook.com
                                                        </a>
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-semibold min-w-[20px]">2.</span>
                                                    <span>Add "Facebook Login" product to your app</span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-semibold min-w-[20px]">3.</span>
                                                    <span>
                                                        Copy your App ID and App Secret, then add them to your{" "}
                                                        <code className="bg-amber-100 px-1.5 py-0.5 rounded">.env</code> file:
                                                    </span>
                                                </li>
                                            </ol>
                                            <div className="mt-4 bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400">
                                                <div>META_APP_ID=your_app_id_here</div>
                                                <div>META_APP_SECRET=your_app_secret_here</div>
                                                <div>META_REDIRECT_URI={window.location.origin}/api/meta/oauth/callback</div>
                                            </div>
                                            <div className="mt-4 space-y-2">
                                                <li className="flex gap-2">
                                                    <span className="font-semibold min-w-[20px]">4.</span>
                                                    <span>
                                                        Add OAuth Redirect URI in your Meta App settings:{" "}
                                                        <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">
                                                            {window.location.origin}/api/meta/oauth/callback
                                                        </code>
                                                    </span>
                                                </li>
                                                <li className="flex gap-2">
                                                    <span className="font-semibold min-w-[20px]">5.</span>
                                                    <span>Restart your server and refresh this page</span>
                                                </li>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => window.open("https://developers.facebook.com/apps/", "_blank")}
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Create Meta App
                                </Button>
                                <Button
                                    onClick={handleConnectMeta}
                                    size="lg"
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Facebook className="w-5 h-5 mr-2" />
                                    Connect with Facebook
                                </Button>
                            </div>

                            <p className="text-sm text-gray-500 mt-4">
                                Need detailed help?{" "}
                                <button
                                    onClick={() => setActiveTab("guide")}
                                    className="text-purple-600 hover:underline"
                                >
                                    View Setup Guide
                                </button>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Main Content - Only show if connected */}
            {isConnected && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                        <TabsTrigger value="leads">Lead Sync</TabsTrigger>
                        <TabsTrigger value="guide">Setup Guide</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Active Campaigns
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {campaigns.filter(c => c.status === 'ACTIVE').length}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                        of {campaigns.length} total
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Total Spend
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-gray-900">₹0</div>
                                    <p className="text-sm text-gray-600 mt-1">This month</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        Leads Generated
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-gray-900">0</div>
                                    <p className="text-sm text-gray-600 mt-1">From Meta ads</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-auto py-4 flex-col items-start"
                                        onClick={() => setActiveTab("campaigns")}
                                    >
                                        <Plus className="w-5 h-5 mb-2" />
                                        <span className="font-semibold">Create Campaign</span>
                                        <span className="text-xs text-gray-500">Start a new ad campaign</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-auto py-4 flex-col items-start"
                                        onClick={() => setActiveTab("leads")}
                                    >
                                        <RefreshCw className="w-5 h-5 mb-2" />
                                        <span className="font-semibold">Sync Leads</span>
                                        <span className="text-xs text-gray-500">Pull new leads from Meta</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-auto py-4 flex-col items-start"
                                        onClick={() => window.open("https://business.facebook.com/adsmanager", "_blank")}
                                    >
                                        <ExternalLink className="w-5 h-5 mb-2" />
                                        <span className="font-semibold">Ads Manager</span>
                                        <span className="text-xs text-gray-500">View in Facebook</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Campaigns Tab */}
                    <TabsContent value="campaigns" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Your Campaigns</CardTitle>
                                    <CreateCampaignDialog
                                        open={isCreateCampaignOpen}
                                        onOpenChange={setIsCreateCampaignOpen}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {campaignsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                                    </div>
                                ) : campaigns.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            No campaigns yet
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Create your first campaign to start reaching potential students
                                        </p>
                                        <Button onClick={() => setIsCreateCampaignOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Campaign
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {campaigns.map((campaign) => (
                                            <CampaignCard key={campaign.id} campaign={campaign} />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Lead Sync Tab */}
                    <TabsContent value="leads" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center">
                                        <Zap className="w-5 h-5 mr-2 text-purple-600" />
                                        Lead Synchronization
                                    </span>
                                    <Button onClick={handleManualSync} disabled={isSyncing}>
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                        Sync Now
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-blue-900 mb-1">
                                                    Real-time Lead Sync Enabled
                                                </h4>
                                                <p className="text-sm text-blue-800">
                                                    Leads from your Meta campaigns are automatically synced to your CRM in real-time via webhooks.
                                                    You can also manually sync at any time using the "Sync Now" button.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Sync History</h4>
                                        <div className="border rounded-lg divide-y">
                                            <div className="p-4 text-center text-gray-500">
                                                No sync history available
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Setup Guide Tab */}
                    <TabsContent value="guide" className="space-y-6">
                        <SetupGuideCard />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

// Campaign Card Component
function CampaignCard({ campaign }: { campaign: MetaCampaign }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
            case 'DELETED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <Badge variant="secondary" className={getStatusColor(campaign.status)}>
                            {campaign.status}
                        </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <div>Objective: {campaign.objective}</div>
                        {campaign.dailyBudget && (
                            <div>Daily Budget: ₹{campaign.dailyBudget.toLocaleString('en-IN')}</div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        {campaign.status === 'ACTIVE' ? (
                            <Pause className="w-4 h-4" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Create Campaign Dialog
function CreateCampaignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: "",
        objective: "LEADS",
        budgetType: "daily",
        budget: "",
    });

    const createCampaignMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest("POST", "/api/meta/campaigns", data);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/meta/campaigns"] });
            toast({ title: "Campaign created successfully!" });
            onOpenChange(false);
            setFormData({ name: "", objective: "LEADS", budgetType: "daily", budget: "" });
        },
        onError: () => {
            toast({ title: "Failed to create campaign", variant: "destructive" });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createCampaignMutation.mutate({
            name: formData.name,
            objective: formData.objective,
            [formData.budgetType === 'daily' ? 'dailyBudget' : 'lifetimeBudget']: parseFloat(formData.budget),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                        Create a new Meta advertising campaign to reach potential students
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaignName">Campaign Name</Label>
                        <Input
                            id="campaignName"
                            placeholder="e.g., Summer Admissions 2026"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="objective">Campaign Objective</Label>
                        <Select
                            value={formData.objective}
                            onValueChange={(value) => setFormData({ ...formData, objective: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LEADS">Lead Generation</SelectItem>
                                <SelectItem value="TRAFFIC">Website Traffic</SelectItem>
                                <SelectItem value="AWARENESS">Brand Awareness</SelectItem>
                                <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Budget Type</Label>
                            <Select
                                value={formData.budgetType}
                                onValueChange={(value) => setFormData({ ...formData, budgetType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily Budget</SelectItem>
                                    <SelectItem value="lifetime">Lifetime Budget</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="budget">Amount (₹)</Label>
                            <Input
                                id="budget"
                                type="number"
                                placeholder="5000"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createCampaignMutation.isPending}>
                            {createCampaignMutation.isPending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Campaign
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Setup Guide Card
function SetupGuideCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Getting Started with Meta Marketing</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <StepCard
                            number={1}
                            title="Connect Your Meta Account"
                            description="Click the 'Connect with Facebook' button to authorize your Facebook account and ad account access."
                            completed={true}
                        />
                        <StepCard
                            number={2}
                            title="Create Your First Campaign"
                            description="Define your campaign objectives, target audience, and budget to start reaching potential students."
                        />
                        <StepCard
                            number={3}
                            title="Design Your Ads"
                            description="Create compelling ad creatives with images, headlines, and call-to-action buttons that resonate with your audience."
                        />
                        <StepCard
                            number={4}
                            title="Set Up Lead Forms"
                            description="Create lead generation forms to capture student information directly from Facebook and Instagram."
                        />
                        <StepCard
                            number={5}
                            title="Monitor & Optimize"
                            description="Track campaign performance and automatically sync leads back to your CRM for follow-up."
                        />
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-900 mb-2">Need Help?</h4>
                        <p className="text-sm text-purple-800 mb-3">
                            Check out our detailed guide on setting up Meta marketing campaigns or contact our support team.
                        </p>
                        <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Documentation
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StepCard({ number, title, description, completed = false }: {
    number: number;
    title: string;
    description: string;
    completed?: boolean;
}) {
    return (
        <div className="flex gap-4">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {completed ? <CheckCircle2 className="w-5 h-5" /> : number}
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    );
}
