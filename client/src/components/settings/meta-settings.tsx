import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, Key, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MetaSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [appId, setAppId] = useState("");
    const [appSecret, setAppSecret] = useState("");
    const [showSecret, setShowSecret] = useState(false);

    // Save Meta credentials
    const saveMutation = useMutation({
        mutationFn: async (data: { appId: string; appSecret: string }) => {
            const response = await apiRequest("POST", "/api/settings/meta-credentials", data);
            return response.json();
        },
        onSuccess: () => {
            toast({ title: "Meta credentials saved successfully!" });
            queryClient.invalidateQueries({ queryKey: ["/api/meta/connection/status"] });
        },
        onError: () => {
            toast({ title: "Failed to save credentials", variant: "destructive" });
        },
    });

    const handleSave = () => {
        if (!appId || !appSecret) {
            toast({ title: "Please fill in all fields", variant: "destructive" });
            return;
        }
        saveMutation.mutate({ appId, appSecret });
    };

    const callbackUrl = `${window.location.origin}/api/meta/oauth/callback`;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-purple-600" />
                        Meta (Facebook) Integration Setup
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Instructions */}
                    <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-semibold">To get started:</p>
                                <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                                    <li>Create a Meta App at <a href="https://developers.facebook.com/" target="_blank" rel="noopener" className="text-blue-600 underline">Facebook for Developers</a></li>
                                    <li>Add "Facebook Login" product to your app</li>
                                    <li>Copy your App ID and App Secret below</li>
                                    <li>Configure the OAuth Redirect URI (shown below)</li>
                                </ol>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* OAuth Callback URL */}
                    <div className="space-y-2">
                        <Label>OAuth Redirect URI</Label>
                        <div className="flex gap-2">
                            <Input value={callbackUrl} readOnly className="font-mono text-sm bg-gray-50" />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(callbackUrl);
                                    toast({ title: "Copied to clipboard!" });
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                        <p className="text-sm text-gray-600">
                            Add this URL to your Meta App's "Valid OAuth Redirect URIs" in Facebook Login settings.
                        </p>
                    </div>

                    {/* App ID */}
                    <div className="space-y-2">
                        <Label htmlFor="appId">
                            Meta App ID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="appId"
                            placeholder="123456789012345"
                            value={appId}
                            onChange={(e) => setAppId(e.target.value)}
                            className="font-mono"
                        />
                        <p className="text-sm text-gray-600">
                            Find this in your Meta App's Settings → Basic
                        </p>
                    </div>

                    {/* App Secret */}
                    <div className="space-y-2">
                        <Label htmlFor="appSecret">
                            Meta App Secret <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="appSecret"
                                type={showSecret ? "text" : "password"}
                                placeholder="••••••••••••••••••••"
                                value={appSecret}
                                onChange={(e) => setAppSecret(e.target.value)}
                                className="font-mono"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSecret(!showSecret)}
                            >
                                {showSecret ? "Hide" : "Show"}
                            </Button>
                        </div>
                        <p className="text-sm text-gray-600">
                            Find this in your Meta App's Settings → Basic (click "Show" button)
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {saveMutation.isPending ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Credentials
                                </>
                            )}
                        </Button>

                        <Button variant="outline" asChild>
                            <a
                                href="https://developers.facebook.com/apps/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open Meta Developer Portal
                            </a>
                        </Button>
                    </div>

                    {/* Success Message */}
                    {saveMutation.isSuccess && (
                        <Alert className="bg-green-50 border-green-200">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Credentials saved! You can now go to the Meta Marketing page and click "Connect with Facebook".
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Help Link */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                            📖 Need detailed setup instructions?
                            <a href="/setup-guide" className="font-semibold underline ml-1">
                                View Complete Setup Guide
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
