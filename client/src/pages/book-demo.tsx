import React, { useState, useEffect, useRef } from "react";
import PublicLayout from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users } from "lucide-react";
import { motion, animate, useMotionValue, useMotionTemplate } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const BookDemoPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    institutionName: "",
    studentsCount: "",
    additionalInfo: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const heroRef = useRef<HTMLDivElement>(null);

  // Animated background color for hero (like landing)
  const color = useMotionValue("#f59e42");
  useEffect(() => {
    animate(color, ["#f59e42", "#643ae5", "#62656e", "#643ae5"], {
      ease: "easeInOut",
      duration: 8,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, [color]);
  const backgroundImage = useMotionTemplate`radial-gradient(120% 80% at 50% 0%, #020617 60%, ${color})`;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Force dark mode for this page
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast({
        title: "Demo Request Submitted!",
        description: "We'll contact you within 24 hours to schedule your personalized demo.",
      });
      setIsSubmitting(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        institutionName: "",
        studentsCount: "",
        additionalInfo: ""
      });
    }, 1000);
  };

  // Hero scroll to form
  const scrollToForm = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#010205] text-white">
        {/* Hero Section */}
        <motion.section className="relative min-h-[10vh] flex flex-col items-center justify-center pt-12 pb-4 mt-24 overflow-hidden">
          <div className="relative z-10 flex flex-col items-center text-center px-2">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">
              Book a Personalized Demo
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-4 max-w-2xl mx-auto">
              See how our AI-powered CRM can transform your institution's admissions process and boost enrollment in India.
            </p>
          </div>
        </motion.section>
        {/* Main Content */}
        <div ref={heroRef} className="container mx-auto px-2">
          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Demo Form */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="border border-[#222] bg-[#18122b]/80 text-white shadow-2xl rounded-xl backdrop-blur-sm">
                <div className="p-6 space-y-1.5">
                  <h3 className="text-2xl font-bold text-white">Schedule Your Personalized Demo</h3>
                  <p className="text-gray-300 text-sm">
                    Fill out the form below and we'll schedule a 30-minute demo tailored to your institution's needs
                  </p>
                </div>
                <div className="p-6 pt-0">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-white">First Name *</Label>
                        <Input
                          id="firstName"
                          placeholder="Amit"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          required
                          className="bg-[#22223b] text-white border-[#643ae5] focus:ring-[#643ae5]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-white">Last Name *</Label>
                        <Input
                          id="lastName"
                          placeholder="Sharma"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          required
                          className="bg-[#22223b] text-white border-[#643ae5] focus:ring-[#643ae5]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-white">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="amit@yourinstitution.in"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        className="bg-[#22223b] text-white border-[#643ae5] focus:ring-[#643ae5]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="institutionName" className="text-white">Institution Name *</Label>
                      <Input
                        id="institutionName"
                        placeholder="Your School/College Name"
                        value={formData.institutionName}
                        onChange={(e) => handleInputChange("institutionName", e.target.value)}
                        required
                        className="bg-[#22223b] text-white border-[#643ae5] focus:ring-[#643ae5]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="studentsCount" className="text-white">Students in Institution *</Label>
                      <Select onValueChange={(value) => handleInputChange("studentsCount", value)} required>
                        <SelectTrigger className="bg-[#22223b] text-white border-[#643ae5] focus:ring-[#643ae5]">
                          <SelectValue placeholder="Select your institution size" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#22223b] text-white border-[#643ae5]">
                          <SelectItem value="under-500">Under 500 students</SelectItem>
                          <SelectItem value="500-1000">500 - 1,000 students</SelectItem>
                          <SelectItem value="1000-2500">1,000 - 2,500 students</SelectItem>
                          <SelectItem value="2500-5000">2,500 - 5,000 students</SelectItem>
                          <SelectItem value="over-5000">Over 5,000 students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="additionalInfo" className="text-white">Additional Information (Optional)</Label>
                      <Textarea
                        id="additionalInfo"
                        placeholder="Tell us about your current challenges or specific needs..."
                        className="min-h-[80px] bg-[#22223b] text-white border-[#643ae5] focus:ring-[#643ae5]"
                        value={formData.additionalInfo}
                        onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full text-white font-semibold text-lg bg-[#643ae5] hover:bg-[#7a4fff]"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Scheduling Demo..." : "Book My Demo"}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>
            {/* What to Expect */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="space-y-4">
              <div className="border border-[#62656e] bg-[#18122b]/80 text-white shadow-2xl rounded-xl backdrop-blur-sm">
                <div className="p-6">
                  <h3 className="flex items-center gap-2 text-white text-2xl font-bold">
                    <Clock className="h-6 w-6 text-[#643ae5] font-bold" />
                    What to Expect
                  </h3>
                </div>
                <div className="p-6 pt-0 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#643ae5] flex items-center justify-center rounded-full font-bold text-lg text-white shadow-lg border-2 border-[#643ae5]">1</div>
                    <div>
                      <h4 className="font-bold text-white text-base">Personal Introduction</h4>
                      <p className="text-gray-300 text-xs">Meet your dedicated specialist and discuss your current workflow</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#643ae5] flex items-center justify-center rounded-full font-bold text-lg text-white shadow-lg border-2 border-[#643ae5]">2</div>
                    <div>
                      <h4 className="font-bold text-white text-base">Live Platform Demo</h4>
                      <p className="text-gray-300 text-xs">See our CRM in action with real scenarios from Indian institutions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#643ae5] flex items-center justify-center rounded-full font-bold text-lg text-white shadow-lg border-2 border-[#643ae5]">3</div>
                    <div>
                      <h4 className="font-bold text-white text-base">Q&A Session</h4>
                      <p className="text-gray-300 text-xs">Get all your questions answered and discuss implementation for your Indian institution</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border border-[#62656e] bg-[#18122b]/80 text-white shadow-2xl rounded-xl backdrop-blur-sm">
                <div className="p-6">
                  <h3 className="flex items-center gap-2 text-white text-2xl font-bold">
                    <Users className="h-6 w-6 text-[#643ae5] font-bold" />
                    Join 500+ Indian Institutions
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  <p className="text-gray-300 mb-3 text-sm">
                    Leading Indian schools, colleges, and coaching centers trust our platform to manage their admissions process.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-extrabold text-[#643ae5] mb-1">95%</div>
                      <div className="text-xs text-gray-300">Customer Satisfaction</div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-[#643ae5] mb-1">3x</div>
                      <div className="text-xs text-gray-300">Faster Lead Processing</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default BookDemoPage;