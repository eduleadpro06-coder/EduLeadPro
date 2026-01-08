import React, { useState, useEffect, useRef } from "react";
import PublicLayout from "@/components/layout/public-layout";
import { Check, Star, Shield, Zap, ArrowRight, IndianRupee, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- AnimatedNumber (from landing page) ---
function AnimatedNumber({ value, duration = 1.2, prefix = "", suffix = "" }: { value: number, duration?: number, prefix?: string, suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    let startTime: number | null = null;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / (duration * 1000), 1);
      setDisplay(start + (value - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {typeof value === "number" && value % 1 !== 0
        ? display.toFixed(1)
        : Math.floor(display)}
      {suffix}
    </span>
  );
}

// RotatingTaglines (copied from landing page)
const taglines = [
  "Did you know? Our AI predicts enrollments with 95% accuracy!",
  "EduConnect adapts to your institution's unique needs.",
  "AI-driven insights, real results.",
  "Admissions, reimagined for the future.",
  "Your growth, powered by intelligence."
];
function RotatingTaglines() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % taglines.length), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.6 }}
        className="text-lg text-orange-200 mt-4 font-medium"
        style={{ minHeight: 32 }}
      >
        {taglines[idx]}
      </motion.div>
    </AnimatePresence>
  );
}

const PricingPage = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.documentElement.classList.add('dark');
    return () => { document.documentElement.classList.remove('dark'); };
  }, []);

  const plans = [
    {
      name: "Starter",
      price: "4,999",
      description: "Perfect for small schools and coaching centers",
      features: [
        "Up to 500 leads per month",
        "Basic lead management",
        "WhatsApp & SMS notifications",
        "Standard reporting",
        "Phone & email support",
        "Basic admission forms",
        "Single branch support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "14,999",
      description: "Ideal for growing educational institutions",
      features: [
        "Up to 2,000 leads per month",
        "Advanced lead scoring",
        "AI-powered insights",
        "Custom admission workflows",
        "WhatsApp & SMS integration",
        "Advanced analytics",
        "Multi-branch support (up to 3)",
        "Priority support",
        "Fee management system",
        "Parent portal access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "34,999",
      description: "For large institutions with complex needs",
      features: [
        "Unlimited leads",
        "Full AI forecasting suite",
        "ERP integrations",
        "Custom reporting",
        "Multi-campus support",
        "API access",
        "Dedicated account manager",
        "24/7 premium support",
        "Advanced fee management",
        "Custom mobile app",
        "Advanced parent portal",
        "Bulk SMS & WhatsApp"
      ],
      popular: false
    }
  ];

  return (
    <PublicLayout>
      <div className="bg-[#010205] min-h-screen text-white">
        {/* Hero Section */}
        <motion.section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-24" style={{ background: "radial-gradient(160% 140% at 50% 0%, #020617 60%, #643ae5 100%)" }}>
          <div className="relative z-10 text-center px-4 max-w-6xl mx-auto flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-gray-300 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              Simple, Transparent Pricing for Indian Institutions
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 dark:text-slate-200 mb-4 max-w-3xl mx-auto">
              Choose a plan that fits your institution's needs and budget. No hidden fees, no surprises—just powerful AI-driven tools to help you grow, engage, and succeed in the Indian education landscape.
            </p>
            <span className="text-lg font-semibold text-orange-200 mb-2">Empowering schools, colleges, and coaching centers across India</span>
            <RotatingTaglines />
          </div>
        </motion.section>
        {/* Pricing Cards Section */}
        <section className="py-24">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16 px-4">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="h-full"
              >
                <div className={`relative h-full flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 backdrop-blur-sm rounded-xl hover:-translate-y-2 ${plan.popular
                  ? 'border-2 border-orange-500 bg-slate-800/60 scale-105 z-10'
                  : 'border border-slate-700 bg-slate-800/40 hover:border-slate-500'
                  }`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1 border-none shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <div className="p-6 text-center pb-8 pt-8 flex-grow-0">
                    <h3 className="text-2xl font-bold text-slate-100">{plan.name}</h3>
                    <p className="text-slate-400 mb-4 text-sm mt-2">
                      {plan.description}
                    </p>
                    <div className="text-4xl font-bold text-slate-100 mt-4">
                      <IndianRupee className="inline-block w-6 h-6" />
                      <AnimatedNumber value={parseInt(plan.price.replace(/,/g, ''))} />
                      <span className="text-lg font-normal text-slate-400">/month</span>
                    </div>
                  </div>
                  <div className="p-6 pt-0 flex flex-col flex-grow">
                    <ul className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto">
                      <Link href="/book-demo">
                        <Button
                          className={`w-full text-white font-bold py-6 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${plan.popular
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-orange-500/20'
                            : 'bg-[#643ae5] hover:bg-[#7a4fff] shadow-purple-500/20'
                            }`}
                        >
                          Start Free Trial
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        {/* Features Comparison Section */}
        <section className="py-16 px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-100">AI-Powered Insights</h3>
              <p className="text-slate-400">
                Make data-driven decisions with our advanced AI algorithms and predictive analytics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-100">Indian Education Focus</h3>
              <p className="text-slate-400">
                Built specifically for Indian educational institutions with local support and features.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-100">Enterprise Security</h3>
              <p className="text-slate-400">
                Bank-grade security with 99.9% uptime and data encryption at rest and in transit.
              </p>
            </div>
          </div>
        </section>
        {/* FAQ Section */}
        <section className="py-16 px-4" id="faq">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border border-slate-700 rounded-lg px-6 bg-slate-800/20">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-medium text-slate-100">Is there a free trial?</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-slate-400 leading-relaxed">Yes! All plans come with a 14-day free trial. No credit card required.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border border-slate-700 rounded-lg px-6 bg-slate-800/20">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-medium text-slate-100">Can I change plans anytime?</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-slate-400 leading-relaxed">Absolutely. You can upgrade or downgrade your plan at any time from your dashboard.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border border-slate-700 rounded-lg px-6 bg-slate-800/20">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-medium text-slate-100">What kind of support do you offer?</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-slate-400 leading-relaxed">We offer phone, email, and WhatsApp support in English and Hindi. Enterprise customers get dedicated account managers.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border border-slate-700 rounded-lg px-6 bg-slate-800/20">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-medium text-slate-100">Is my data secure?</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-slate-400 leading-relaxed">Yes. We use enterprise-grade encryption and are compliant with Indian data protection standards.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Ready to Transform Your Institution?
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90 text-white">
                Join 500+ educational institutions that have revolutionized their admissions process with EduConnect's AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button size="lg" className="px-8 py-4 rounded-full bg-[#643ae5] hover:bg-[#7a4fff] text-white font-bold text-lg shadow-lg border-none transition-all duration-300 hover:scale-105" onClick={() => setLocation('/book-demo')}>
                  Book a Demo Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-4 rounded-full border-2 border-white text-white hover:bg-white/10 hover:text-white font-bold text-lg" onClick={() => setLocation('/pricing')}>
                  View Pricing Plans
                </Button>
              </div>
              <RotatingTaglines />
            </motion.div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default PricingPage;