import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Megaphone, 
  Brain, 
  Target, 
  IndianRupee, 
  MessageSquare, 
  Share2,
  Lightbulb,
  TrendingUp,
  Copy,
  RefreshCw
} from "lucide-react";

interface MarketingRecommendation {
  targetAudience: string;
  platforms: string[];
  budget: string;
  adCopy: string[];
  creativeIdeas: string[];
}

export default function Marketing() {
  const [targetClass, setTargetClass] = useState("");
  const [budget, setBudget] = useState("");
  const [recommendations, setRecommendations] = useState<MarketingRecommendation | null>(null);
  const { toast } = useToast();

  const generateRecommendationsMutation = useMutation({
    mutationFn: async (data: { targetClass: string; budget: string }) => {
      const response = await apiRequest("POST", "/api/ai/marketing-recommendations", data);
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data);
      toast({ title: "Marketing recommendations generated!" });
    },
    onError: () => {
      toast({ title: "Failed to generate recommendations", variant: "destructive" });
    },
  });

  const handleGenerateRecommendations = () => {
    if (!targetClass || !budget) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    generateRecommendationsMutation.mutate({ targetClass, budget });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Marketing Support</h1>
        <p className="text-gray-600 mt-2">Get AI-powered marketing recommendations and campaign ideas</p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            Generate Marketing Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="targetClass">Target Class/Grade</Label>
              <Select value={targetClass} onValueChange={setTargetClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pre-K">Pre-K</SelectItem>
                  <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                  <SelectItem value="Class 1">Class 1</SelectItem>
                  <SelectItem value="Class 2">Class 2</SelectItem>
                  <SelectItem value="Class 3">Class 3</SelectItem>
                  <SelectItem value="Class 4">Class 4</SelectItem>
                  <SelectItem value="Class 5">Class 5</SelectItem>
                  <SelectItem value="Class 6">Class 6</SelectItem>
                  <SelectItem value="Class 7">Class 7</SelectItem>
                  <SelectItem value="Class 8">Class 8</SelectItem>
                  <SelectItem value="Class 9">Class 9</SelectItem>
                  <SelectItem value="Class 10">Class 10</SelectItem>
                  <SelectItem value="Class 11">Class 11</SelectItem>
                  <SelectItem value="Class 12">Class 12</SelectItem>
                  <SelectItem value="All Classes">All Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Monthly Marketing Budget</Label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="₹10,000-25,000">₹10,000 - ₹25,000</SelectItem>
                  <SelectItem value="₹25,000-50,000">₹25,000 - ₹50,000</SelectItem>
                  <SelectItem value="₹50,000-100,000">₹50,000 - ₹1,00,000</SelectItem>
                  <SelectItem value="₹100,000-200,000">₹1,00,000 - ₹2,00,000</SelectItem>
                  <SelectItem value="₹200,000+">₹2,00,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-6">
            <Button 
              onClick={handleGenerateRecommendations}
              disabled={generateRecommendationsMutation.isPending}
              className="w-full md:w-auto"
            >
              {generateRecommendationsMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4 mr-2" />
                  Generate AI Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Display */}
      {recommendations && (
        <div className="space-y-6">
          {/* Target Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{recommendations.targetAudience}</p>
            </CardContent>
          </Card>

          {/* Recommended Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="w-5 h-5 mr-2 text-green-600" />
                Recommended Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recommendations.platforms.map((platform, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {platform}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Budget Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <IndianRupee className="w-5 h-5 mr-2 text-purple-600" />
                Budget Allocation Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{recommendations.budget}</p>
            </CardContent>
          </Card>

          {/* Ad Copy Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-orange-600" />
                AI-Generated Ad Copy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.adCopy.map((copy, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <p className="text-gray-700 flex-1">{copy}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(copy)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Creative Ideas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                Creative Campaign Ideas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.creativeIdeas.map((idea, index) => (
                  <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-gray-700 text-sm">{idea}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Marketing Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
            Marketing Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Know Your Audience</h4>
              <p className="text-sm text-gray-600">
                Understand parent demographics, concerns, and decision-making factors for effective targeting.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">Test and Optimize</h4>
              <p className="text-sm text-gray-600">
                A/B test different ad copies, images, and targeting options to find what works best.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">Multi-Channel Approach</h4>
              <p className="text-sm text-gray-600">
                Use a combination of digital platforms and traditional methods for maximum reach.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
