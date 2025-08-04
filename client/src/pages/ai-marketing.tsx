import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Target, IndianRupee, Users, Copy, ExternalLink, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CampaignManager from "@/components/campaigns/campaign-manager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Glow } from "@/components/ui/feature-steps";

interface MarketingRecommendation {
  campaign_type: string;
  target_audience: string;
  platform: string;
  budget_suggestion: string;
  ad_copy: string;
  expected_leads: number;
}

export default function AIMarketing() {
  const [ageGroup, setAgeGroup] = useState("14-18");
  const [location, setLocation] = useState("Mumbai");
  const [budget, setBudget] = useState("50000");
  const [recommendations, setRecommendations] = useState<MarketingRecommendation[]>([]);
  const { toast } = useToast();

  const generateRecommendations = useMutation({
    mutationFn: async (data: { ageGroup: string; location: string; budget: number }) => {
      const response = await apiRequest("POST", "/api/ai/marketing-recommendations", data);
      return response.json();
    },
    onSuccess: (data) => {
      setRecommendations(data);
      toast({
        title: "Marketing Recommendations Generated",
        description: "AI has analyzed your requirements and generated campaign suggestions.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Unable to generate recommendations at this time",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Ad copy has been copied to your clipboard",
    });
  };

  const platformIcons = {
    "Facebook & Instagram": "📘",
    "Google Ads": "🔍",
    "YouTube": "📺",
    "LinkedIn": "💼",
    "WhatsApp": "💬"
  };

  const handleGenerate = () => {
    generateRecommendations.mutate({
      ageGroup,
      location,
      budget: Number(budget)
    });
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", duration: 0.7 } },
    hover: { scale: 1.03, boxShadow: "0 0 40px #643ae5aa" },
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Glow />
      {/* <div className=\"absolute inset-0 bg-gradient-to-br from-[#23243a]/80 via-[#643ae5]/10 to-[#010205]/90 pointer-events-none z-0\" /> */}
      <Header className="py-4 relative z-10" />
      <main className="p-6 space-y-10 max-w-7xl mx-auto relative z-10">
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="mb-6 bg-[#23243a] rounded-xl p-1 flex gap-2">
            <TabsTrigger value="ai" className="text-white data-[state=active]:bg-[#643ae5] data-[state=active]:text-white rounded-lg px-6 py-2 font-semibold transition-all">AI Recommendations</TabsTrigger>
            <TabsTrigger value="campaigns" className="text-white data-[state=active]:bg-[#643ae5] data-[state=active]:text-white rounded-lg px-6 py-2 font-semibold transition-all">Campaign Manager</TabsTrigger>
          </TabsList>
          <TabsContent value="ai">
            {/* Input Form */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="bg-[#23243a]/90 glass-card border-none shadow-2xl rounded-3xl mb-10"
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <Sparkles className="mr-3 text-[#643ae5]" size={24} />
                  Campaign Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="age-group" className="text-sm font-medium">Target Age Group</Label>
                    <Input
                      id="age-group"
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value)}
                      placeholder="e.g., 14-18"
                      className="h-10 bg-[#23243a] text-white border-[#643ae5] focus:ring-[#643ae5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Mumbai, Delhi"
                      className="h-10 bg-[#23243a] text-white border-[#643ae5] focus:ring-[#643ae5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-sm font-medium">Monthly Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="50000"
                      className="h-10 bg-[#23243a] text-white border-[#643ae5] focus:ring-[#643ae5]"
                    />
                  </div>
                </div>
                <Button 
                  className="mt-8 w-full md:w-auto h-11 px-6 bg-[#643ae5] text-white font-semibold shadow-xl"
                  onClick={handleGenerate}
                  disabled={generateRecommendations.isPending}
                >
                  <Megaphone className="mr-2" size={16} />
                  {generateRecommendations.isPending ? "Generating..." : "Generate AI Recommendations"}
                </Button>
              </CardContent>
            </motion.div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Target className="mr-3 text-blue-400" size={28} />
                  Recommended Campaigns
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      className="bg-[#23243a]/90 glass-card border-none shadow-xl rounded-2xl transition-all duration-200"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-lg">
                            <span className="text-2xl mr-3">
                              {platformIcons[rec.platform as keyof typeof platformIcons] || "📱"}
                            </span>
                            {rec.campaign_type}
                          </CardTitle>
                          <Badge className="bg-[#643ae5]/20 text-[#643ae5] px-3 py-1">
                            {rec.platform}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center space-x-3">
                            <Users className="text-blue-400" size={18} />
                            <div>
                              <div className="text-sm font-medium text-white">Target Audience</div>
                              <div className="text-sm text-gray-300">{rec.target_audience}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <IndianRupee className="text-green-400" size={18} />
                            <div>
                              <div className="text-sm font-medium text-white">Budget</div>
                              <div className="text-sm text-gray-300">{rec.budget_suggestion}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-white">Ad Copy</Label>
                          <div className="mt-2 p-4 bg-[#23243a]/70 rounded-lg border border-[#643ae5]/30">
                            <p className="text-sm text-white leading-relaxed">{rec.ad_copy}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-9 text-[#643ae5] hover:bg-[#643ae5]/10"
                            onClick={() => copyToClipboard(rec.ad_copy)}
                          >
                            <Copy className="mr-2" size={14} />
                            Copy Ad Copy
                          </Button>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-[#643ae5]/20">
                          <div>
                            <div className="text-sm font-medium text-white">Expected Leads</div>
                            <div className="text-2xl font-bold text-green-400">{rec.expected_leads}</div>
                          </div>
                          <Button variant="outline" size="sm" className="h-9 border-[#643ae5] text-[#643ae5]">
                            <ExternalLink className="mr-2" size={14} />
                            Create Campaign
                          </Button>
                        </div>
                      </CardContent>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Marketing Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="bg-[#23243a]/90 glass-card border-none shadow-xl rounded-2xl transition-all"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-white">Campaign Best Practices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-5 bg-[#643ae5]/10 rounded-lg border border-[#643ae5]/30">
                    <h4 className="font-medium text-[#643ae5] text-lg">Timing Optimization</h4>
                    <p className="text-sm text-[#643ae5] mt-2 leading-relaxed">
                      Run admission campaigns during peak seasons (March-June, September-December) for maximum impact.
                    </p>
                  </div>
                  <div className="p-5 bg-green-900/20 rounded-lg border border-green-400/30">
                    <h4 className="font-medium text-green-400 text-lg">Content Strategy</h4>
                    <p className="text-sm text-green-200 mt-2 leading-relaxed">
                      Focus on student success stories, faculty achievements, and campus facilities to build trust.
                    </p>
                  </div>
                  <div className="p-5 bg-purple-900/20 rounded-lg border border-purple-400/30">
                    <h4 className="font-medium text-purple-400 text-lg">Audience Targeting</h4>
                    <p className="text-sm text-purple-200 mt-2 leading-relaxed">
                      Target both students and parents with age-appropriate messaging and platforms.
                    </p>
                  </div>
                </CardContent>
              </motion.div>

              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="bg-[#23243a]/90 glass-card border-none shadow-xl rounded-2xl transition-all"
              >
                <CardHeader>
                  <CardTitle className="text-white">Performance Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Key Metrics to Monitor</h4>
                      <div className="space-y-2">
                        {[
                          "Cost per Lead (CPL)",
                          "Click-through Rate (CTR)",
                          "Conversion Rate",
                          "Lead Quality Score",
                          "Return on Ad Spend (ROAS)"
                        ].map((metric, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-[#23243a]/70 rounded">
                            <span className="text-sm text-gray-200">{metric}</span>
                            <Badge variant="outline" className="border-[#643ae5] text-[#643ae5]">Track</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            </div>

            {/* Sample Creative Ideas */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="bg-[#23243a]/90 glass-card border-none shadow-xl rounded-2xl transition-all"
            >
              <CardHeader>
                <CardTitle className="text-white">Creative Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-[#643ae5]/30 rounded-lg bg-[#643ae5]/10">
                    <h4 className="font-medium text-white mb-2">📱 Social Media Posts</h4>
                    <p className="text-sm text-gray-200">Student testimonials, virtual campus tours, achievement highlights</p>
                  </div>
                  <div className="p-4 border border-green-400/30 rounded-lg bg-green-900/20">
                    <h4 className="font-medium text-white mb-2">🎥 Video Content</h4>
                    <p className="text-sm text-gray-200">Day-in-the-life videos, faculty interviews, alumni success stories</p>
                  </div>
                  <div className="p-4 border border-purple-400/30 rounded-lg bg-purple-900/20">
                    <h4 className="font-medium text-white mb-2">📊 Infographics</h4>
                    <p className="text-sm text-gray-200">Placement statistics, course curriculum, campus facilities comparison</p>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          </TabsContent>
          <TabsContent value="campaigns">
            <CampaignManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
