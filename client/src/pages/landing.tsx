import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import InteractiveHero from "@/components/landing/interactive-hero";
import { motion, useMotionValue, useMotionTemplate, animate, AnimatePresence, useAnimation, useInView, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useScrollFloat } from "@/hooks/useScrollFloat";
import { cn } from "@/lib/utils";
import {
  Home,
  GraduationCap,
  TrendingUp,
  Menu,
  X,
  ChevronDown,
  Star,
  ArrowRight,
  Shield,
  Zap,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Heart,
  CheckCircle,
  Check,
  Linkedin,
  Twitter,
  Facebook,
  MessageSquarePlus
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

import Earth from "../../../components/ui/globe";
// Remove the AnimatedInsights import
// import AnimatedInsights from "../components/dashboard/animated-insights";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState as useState3 } from "react";
import HeroSection from "../components/landing/hero-section";
import ScrollStack, { ScrollStackItem } from "../components/ui/scroll-stack";
import AISolutionCard from "../components/ui/ai-solution-card";
import { DonutBadge } from "../components/ui/donut-badge";
import DashboardHighlights from "../components/landing/DashboardHighlights";
import {
  Users, Brain, Target, BarChart3, MessageSquare, Calendar
} from "lucide-react";
import { useHashScroll } from "@/hooks/use-hash-scroll";
import NavBar from "@/components/ui/navbar";
import FeedbackButton from "@/components/ui/feedback-button";
import FeedbackForm from "@/components/forms/feedback-form";
import PublicLayout from "@/components/layout/public-layout";


// --- Unique Visual Components ---
// ConstellationNetwork: Dynamic constellation of points and lines
const ConstellationNetwork = ({ mouseX, mouseY }: { mouseX: number; mouseY: number }) => {
  // Generate static points on mount
  const points = React.useMemo(() => (
    Array.from({ length: 18 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * 400 + 100
    }))
  ), []);
  // Animate a shooting star
  const [shooting, setShooting] = React.useState(false);
  React.useEffect(() => {
    const timeout = setTimeout(() => setShooting(true), 6000 + Math.random() * 4000);
    return () => clearTimeout(timeout);
  }, [shooting]);
  React.useEffect(() => {
    if (shooting) {
      const timeout = setTimeout(() => setShooting(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [shooting]);
  // Shooting star path
  const shootingStart = { x: 100, y: 120 };
  const shootingEnd = { x: window.innerWidth - 100, y: 320 };
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x + (mouseX - window.innerWidth / 2) / 18}
          cy={p.y + (mouseY - 300) / 18}
          r={3.5 + Math.sin(Date.now() / 900 + i) * 1.2}
          fill={`hsl(${200 + i * 10}, 100%, 90%)`}
          opacity={0.95}
          animate={{
            r: [3.5, 5, 3.5],
            opacity: [0.95, 0.7, 0.95]
          }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.13 }}
        />
      ))}
      {points.map((p1, i) =>
        points.map((p2, j) => (
          i < j && Math.hypot(p1.x - p2.x, p1.y - p2.y) < 160 ? (
            <motion.line
              key={i + '-' + j}
              x1={p1.x + (mouseX - window.innerWidth / 2) / 18}
              y1={p1.y + (mouseY - 300) / 18}
              x2={p2.x + (mouseX - window.innerWidth / 2) / 18}
              y2={p2.y + (mouseY - 300) / 18}
              stroke={`hsl(${220 + (i + j) * 7}, 100%, 80%)`}
              strokeWidth={1.2}
              opacity={0.35 + 0.12 * Math.sin(Date.now() / 1200 + i + j)}
              initial={false}
              animate={{
                opacity: [0.35, 0.55, 0.35]
              }}
              transition={{ duration: 2.5, repeat: Infinity, delay: (i + j) * 0.07 }}
            />
          ) : null
        ))
      )}
      {/* Shooting star */}
      {shooting && (
        <motion.line
          x1={shootingStart.x}
          y1={shootingStart.y}
          x2={shootingEnd.x}
          y2={shootingEnd.y}
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{ opacity: [0, 1, 0], pathLength: [0, 1, 0] }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      )}
    </svg>
  );
};

// AnimatedJourneyPath: SVG line that grows as user scrolls
const AnimatedJourneyPath = ({ progress }: { progress: number }) => (
  <svg width="8" height="100%" style={{ position: 'absolute', left: -24, top: 0, height: '100%', zIndex: 2 }}>
    <motion.line
      x1="4" y1="0" x2="4" y2="1000"
      stroke="#f59e42" strokeWidth="6" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: progress }}
      transition={{ duration: 1, ease: "easeInOut" }}
    />
  </svg>
);

// RotatingTaglines: Rotates through AI-generated taglines
const taglines = [
  "Did you know? Our AI predicts enrollments with 95% accuracy!",
  "Yonerra adapts to your institution's unique needs.",
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

// --- End Unique Visual Components ---

// --- Testimonial Carousel ---
import { useState as useState2, useEffect as useEffect2 } from "react";
import { AnimatePresence as AnimatePresence2 } from "framer-motion";
import { useScrollFloat as useScrollFloat2 } from "@/hooks/useScrollFloat";

const testimonials = [
  {
    name: "Priya S.",
    role: "Principal, Delhi Public School",
    quote: "Yonerra transformed our admissions process. We saw a 35% increase in enrollments!",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg"
  },
  {
    name: "Ravi K.",
    role: "Director, Bright Minds Academy",
    quote: "The AI predictions are spot on. Our team saves hours every week.",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg"
  },
  {
    name: "Anjali M.",
    role: "Admissions Head, Sunrise College",
    quote: "Seamless integration and fantastic support. Highly recommended!",
    avatar: "https://randomuser.me/api/portraits/women/43.jpg"
  }
];

function TestimonialCarousel() {
  const [idx, setIdx] = useState2(0);
  useEffect2(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 6000);
    return () => clearInterval(t);
  }, []);
  // Subtle float effect for the main testimonial card
  const { ref, y } = useScrollFloat2([0, 1], [0, -20]);
  return (
    <div className="w-full flex flex-col items-center mb-20">
      <div className="relative w-full max-w-2xl h-64 flex items-center justify-center">
        <AnimatePresence2 mode="wait">
          <motion.div
            key={idx}
            ref={ref}
            style={{ y }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.7 }}
            className="absolute w-full"
          >
            <motion.div
              whileHover={{ y: -8, rotate: 2, boxShadow: "0 8px 32px rgba(251,146,60,0.15)" }}
              animate={{ y: [0, -4, 0], boxShadow: ["0 2px 8px #f59e4222", "0 8px 32px #f59e4222", "0 2px 8px #f59e4222"] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 flex flex-col items-center relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

              <img src={testimonials[idx].avatar} alt={testimonials[idx].name} className="w-20 h-20 rounded-full mb-4 border-4 border-orange-200/20 shadow relative z-10" />
              <p className="text-lg text-slate-200 italic mb-4 text-center relative z-10">"{testimonials[idx].quote}"</p>
              <div className="font-semibold text-orange-400 relative z-10">{testimonials[idx].name}</div>
              <div className="text-slate-400 text-sm relative z-10">{testimonials[idx].role}</div>
            </motion.div>
          </motion.div>
        </AnimatePresence2>
      </div>
      <div className="flex space-x-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${i === idx ? "bg-orange-500" : "bg-slate-700 hover:bg-slate-600"}`}
            onClick={() => setIdx(i)}
            aria-label={`Show testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// Correct ContainerScroll implementation for animated 'See It In Action' section
import { useScroll, useTransform } from "framer-motion";

const ContainerScroll = ({ titleComponent, children }: { titleComponent: React.ReactNode; children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <motion.div
          style={{
            translateY: translate,
          }}
          className="div max-w-5xl mx-auto text-center"
        >
          {titleComponent}
        </motion.div>
        <motion.div
          style={{
            rotateX: rotate,
            scale,
          }}
          className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px]"
        >
          <div className="h-full w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-4 flex flex-col items-center justify-center">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// MiniDashboard component for interactive demo in ContainerScroll
// Replace MiniDashboard slides with image-based slides
const dashboardSlides = [
  {
    key: 'ai-forecasting',
    title: 'AI Predictions',
    image: '/assets/ai-agent.png', // Use available forecasting image for AI Predictions
  },
  {
    key: 'dashboard',
    title: 'Dashboard',
    image: '/assets/Dashboard.png', // Use the provided local SVG for Dashboard
  },
  {
    key: 'leads-management',
    title: 'Leads Management',
    image: '/assets/Lead-Management.png', // Use available image for Leads Management
  },
];

function MiniDashboard() {
  const [tab, setTab] = useState<string>(dashboardSlides[0].key);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide effect
  useEffect(() => {
    if (autoSlideRef.current) clearTimeout(autoSlideRef.current);
    autoSlideRef.current = setTimeout(() => {
      setDirection(1);
      setTab((prev) => {
        const idx = dashboardSlides.findIndex(s => s.key === prev);
        return dashboardSlides[(idx + 1) % dashboardSlides.length].key;
      });
    }, 2000);
    return () => { if (autoSlideRef.current) { clearTimeout(autoSlideRef.current); } };
  }, [tab]);

  const handleTabClick = (key: string) => {
    setDirection(dashboardSlides.findIndex(s => s.key === key) > dashboardSlides.findIndex(s => s.key === tab) ? 1 : -1);
    setTab(key);
  };

  const currentSlide = dashboardSlides.find(s => s.key === tab);

  return (
    <div className="flex flex-col items-center">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 relative">
        {dashboardSlides.map((slide) => (
          <button
            key={slide.key}
            className={cn(
              "relative px-4 py-2 rounded-full font-medium text-sm transition-colors duration-300",
              tab === slide.key
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
                : "bg-white/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-200 hover:bg-blue-100/60 dark:hover:bg-zinc-700/60"
            )}
            style={{ zIndex: 1 }}
            onClick={() => handleTabClick(slide.key)}
          >
            <span className="flex items-center">
              {slide.title}
            </span>
            {tab === slide.key && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 z-0"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      {/* Sliding Image Pages */}
      <div className="w-full h-48 md:fixed md:inset-0 md:w-screen md:h-screen md:z-50 md:bg-black md:rounded-none md:p-0 lg:static lg:w-full lg:h-80 lg:rounded-2xl mb-6 relative overflow-hidden flex items-center justify-center p-2 md:p-0">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={tab}
            custom={direction}
            initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
            className="absolute w-full h-full top-0 left-0 flex flex-col items-center justify-center"
          >
            <img
              src={currentSlide?.image}
              alt={currentSlide?.title}
              className="max-h-40 md:w-screen md:h-screen md:max-h-none md:object-cover lg:w-auto lg:h-auto lg:max-h-72 w-auto object-contain rounded-xl shadow-lg bg-white"
              style={{ padding: '12px', background: 'rgba(255,255,255,0.05)' }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent py-4 px-6 rounded-b-2xl md:rounded-none">
              <h3 className="text-2xl font-bold text-white drop-shadow-lg text-center">{currentSlide?.title}</h3>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper for animated count up
function AnimatedNumber({ value, duration = 1.2, prefix = "", suffix = "" }: { value: number, duration?: number, prefix?: string, suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) {
      motionValue.set(0);
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      setDisplay(latest);
    });
  }, [spring]);

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

// Main Landing Page Component (outer structure only for now)
export default function Landing() {
  useHashScroll();
  const [location, setLocation] = useLocation();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
    institution: ""
  });
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [featureProgress, setFeatureProgress] = useState(0);
  // Add FAQ open/close state
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  // Add state for feedback form
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the form submission
    console.log("Contact form submitted:", contactForm);
    // Reset form
    setContactForm({
      name: "",
      email: "",
      message: "",
      institution: ""
    });
    // Show success message or redirect
  };

  // For the features grid/cards, use schoolFeatures:
  const schoolFeatures = [
    {
      icon: Users,
      title: "Intelligent Lead Management",
      description: "Track, nurture, and convert prospective students with AI-powered lead scoring and automated follow-up sequences. Supports WhatsApp, SMS, and regional languages.",
      stat: { label: "97% conversion rate", color: "bg-green-900/80 text-green-300", icon: "zap" },
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-300"
    },
    {
      icon: Brain,
      title: "AI Admission Predictions",
      description: "Predict enrollment likelihood with 95% accuracy using machine learning algorithms trained on Indian admission patterns.",
      stat: { label: "95% accuracy", color: "bg-purple-900/80 text-purple-200", icon: "zap" },
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-300"
    },
    {
      icon: Target,
      title: "Smart Marketing Automation",
      description: "Generate high-converting campaigns with AI-driven content creation, audience targeting, and budget optimization for Indian markets.",
      stat: { label: "40% more leads", color: "bg-pink-900/80 text-pink-200", icon: "zap" },
      iconBg: "bg-green-500/20",
      iconColor: "text-green-300"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics Dashboard",
      description: "Monitor performance metrics, track conversion rates, and identify growth opportunities with comprehensive reporting. GST-ready and Indian compliance supported.",
      stat: { label: "GST-ready", color: "bg-orange-900/80 text-orange-200", icon: "zap" },
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-300"
    },
    {
      icon: MessageSquare,
      title: "Omnichannel Communication",
      description: "Engage prospects across WhatsApp, SMS, email, and voice calls with unified conversation management. Bulk messaging for Indian admissions.",
      stat: { label: "Bulk messaging", color: "bg-blue-900/80 text-blue-200", icon: "zap" },
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-300"
    },
    {
      icon: Calendar,
      title: "Smart Scheduling & Automation",
      description: "Automate follow-ups, schedule counseling sessions, and send timely reminders to maximize conversion rates during Indian admission seasons.",
      stat: { label: "Auto reminders", color: "bg-indigo-900/80 text-indigo-200", icon: "zap" },
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-300"
    }
  ];

  const aiFeatures = [
    {
      icon: Sparkles,
      title: "Predictive Enrollment Forecasting",
      description: "Forecast future enrollments for Indian institutions with 90% accuracy using advanced ML models that analyze local data, seasonal trends, and market conditions."
    },
    {
      icon: TrendingUp,
      title: "Revenue Growth Acceleration",
      description: "Increase revenue by 40% through AI-optimized pricing strategies, targeted upselling, and demand prediction algorithms tailored for Indian education."
    },
    {
      icon: Heart,
      title: "Enhanced Parent Engagement",
      description: "Build stronger relationships with personalized communication, automated progress updates, and AI-powered sentiment analysis in Indian languages."
    }
  ];

  const faqItems = [
    {
      question: "How quickly can we implement Yonerra in our institution?",
      answer: "Most Indian institutions are up and running within 2-3 days. Our team provides complete setup assistance, data migration support, and comprehensive training tailored for Indian staff."
    },
    {
      question: "Is Yonerra suitable for small educational institutions?",
      answer: "Absolutely! Our Starter plan is designed specifically for Indian schools and coaching centers with up to 200 students. You can scale up as your institution grows without any migration hassles."
    },
    {
      question: "How does the AI prediction system work?",
      answer: "Our AI analyzes multiple data points including student demographics, engagement patterns, communication history, and behavioral indicators to predict enrollment likelihood with 95% accuracy for Indian admissions."
    },
    {
      question: "Can Yonerra integrate with our existing systems?",
      answer: "Yes! We offer seamless integrations with popular Indian ERPs like Tally, Zoho, and more. Our API also allows custom integrations with any system you currently use."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We provide 24/7 customer support in English, Hindi, and regional languages, dedicated account managers for Enterprise clients, and regular training sessions for Indian institutions."
    },
    {
      question: "Is our data secure with Yonerra?",
      answer: "Security is our top priority. We use enterprise-grade encryption, comply with Indian data protection standards, and undergo regular security audits to protect your sensitive information."
    }
  ];

  // 1. Add animated underline CSS for nav links
  const navLinkClass =
    "relative text-slate-900 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-semibold px-2 py-1 focus:outline-none group";

  const [ripple, setRipple] = useState<{ x: number, y: number, key: number } | null>(null);
  const ctaButtonRef = useRef<HTMLButtonElement>(null);

  function handleCtaClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = ctaButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setRipple({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        key: Date.now()
      });
      setTimeout(() => setRipple(null), 600);
    }
    setLocation("/book-demo");
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  }

  // For demo modal
  const [demoOpen, setDemoOpen] = useState3(false);
  // For confetti
  const [showConfetti, setShowConfetti] = useState3(false);

  // Navigation items (will adapt to your original nav logic)
  // const navItems = [
  //   { name: "Home", url: "#home", icon: Home },
  //   { name: "Features", url: "#features", icon: BarChart3 },
  //   { name: "AI Solutions", url: "#ai-future", icon: Brain },
  //   { name: "FAQ", url: "#faq", icon: ChevronDown },
  //   { name: "Contact", url: "#contact", icon: GraduationCap },
  // ];
  // Animated color for hero background
  const color = useMotionValue("#f59e42");
  useEffect(() => {
    animate(color, ["#f59e42", "#ec4899", "#a78bfa", "#10b981"], {
      ease: "easeInOut",
      duration: 8,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, [color]);
  const backgroundImage = useMotionTemplate`radial-gradient(125% 80% at 50% 0%, #020617 50%, ${color})`;

  // Features for FeatureSteps (step, title, content, image)
  const features = [
    {
      step: "Step 1",
      title: "Predictive Enrollment Forecasting",
      content: "Forecast future enrollments for Indian institutions with 90% accuracy using advanced ML models that analyze local data, seasonal trends, and market conditions.",
      image: "/assets/forecasting.png" // Indian students in classroom
    },
    {
      step: "Step 2",
      title: "Revenue Growth Acceleration",
      content: "Increase revenue by 40% through AI-optimized pricing strategies, targeted upselling, and demand prediction algorithms tailored for Indian education.",
      image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80" // Indian rupee notes
    },
    {
      step: "Step 3",
      title: "Enhanced Parent Engagement",
      content: "Build stronger relationships with personalized communication, automated progress updates, and AI-powered sentiment analysis in Indian languages.",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" // Indian family
    }
  ];

  // Enhanced AI Features with relevant images and icons
  const aiFeaturesEnhanced = [
    {
      step: "Step 1",
      title: "Predictive Enrollment Forecasting",
      content: "Forecast future enrollments for Indian institutions with 90%+ accuracy using advanced ML models that analyze local data, seasonal trends, and market conditions.",
      image: "/assets/forecasting.png", // Indian classroom
      icon: Sparkles,
    },
    {
      step: "Step 2",
      title: "Revenue Growth Acceleration",
      content: "Increase revenue by up to 40% with AI-optimized pricing, upselling, and demand prediction.",
      image: "/assets/revenue-growth-acceleration.png", // <-- Updated image path
      icon: TrendingUp,
    },
    {
      step: "Step 3",
      title: "Enhanced Parent Engagement",
      content: "Build stronger relationships with personalized communication, automated progress updates, and AI-powered sentiment analysis in Indian languages.",
      image: "/assets/enhanced-parent-engagement.png", // Indian family
      icon: Heart,
    },
  ];

  // Force dark mode on mount, revert on unmount
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  function handleCtaClickWithConfetti(e: React.MouseEvent<HTMLButtonElement>) {
    handleCtaClick(e);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1800);
  }

  // Map feature title to icon (outside the map function)
  const featureIcons: Record<string, JSX.Element> = {
    "Intelligent Lead Management": <Users color="white" size={28} />,
    "AI Admission Predictions": <Brain color="white" size={28} />,
    "Smart Marketing Automation": <Target color="white" size={28} />,
    "Real-time Analytics Dashboard": <BarChart3 color="white" size={28} />,
    "Omnichannel Communication": <MessageSquare color="white" size={28} />,
    "Smart Scheduling & Automation": <Calendar color="white" size={28} />,
  };

  return (
    <PublicLayout>
      {/* Hero Section (placeholder for now) */}
      <motion.section id="home" style={{ backgroundImage }} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-40 pb-20 font-sans">
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 max-w-6xl mx-auto text-center">
          <h1 className="text-white font-extrabold text-5xl md:text-7xl leading-tight mb-8">
            <span>One platform – total control</span><br />
            <span>of your Institution flows</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-12 max-w-2xl mx-auto font-normal">
            Centralizing all your monthly expenses in one place to control your cash flow and excel in financial planning.
          </p>
          <div className="flex flex-row gap-6 justify-center mt-2">
            <Button
              size="lg"
              className="w-44 h-14 bg-white text-black font-semibold rounded-xl shadow hover:bg-gray-100 transition-colors text-base"
              onClick={handleCtaClickWithConfetti}
            >
              Get started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-44 h-14 border border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-base bg-transparent"
              onClick={() => setLocation('/pricing')}
            >
              Learn more
            </Button>
          </div>
          <div className="w-full mt-10 mb-[-4rem]">
            <InteractiveHero />
          </div>
        </div>
      </motion.section>
      {/* All other sections wrapped in a dark background */}
      <div className="bg-[#010205]">
        {/* Features Section */}
        <section id="features" className="relative py-24" style={{ background: "#010205" }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-extrabold text-white mb-10" style={{ letterSpacing: "-0.03em" }}>
                Unparalleled advantages
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {schoolFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center"
                >
                  {/* DonutBadge with mapped icon */}
                  <div className="mb-6">
                    <DonutBadge
                      segments={[
                        { color: "#a259e6", value: 25 },
                        { color: "#ff6a4d", value: 25 },
                        { color: "#222", value: 50 },
                      ]}
                      icon={featureIcons[feature.title]}
                      size={80}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-base text-slate-300 max-w-xs mx-auto">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section (Enhanced AI Solutions) */}
        <section
          id="ai-future"
          className="relative bg-[#010205] overflow-hidden py-20"
          style={{ minHeight: '300vh' }}
        >
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-lg">
                AI-Powered Solutions for <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Indian Institutions</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Unlock the full potential of your institution with advanced AI features designed for Indian education. Explore how our platform can forecast enrollments, accelerate revenue, and build stronger parent relationships.
              </p>
            </motion.div>
            <div className="max-w-6xl mx-auto">
              <ScrollStack
                itemScale={0.04}
                itemStackDistance={40}
                stackPosition="25%"
                scaleEndPosition="15%"
                baseScale={0.85}
                scaleDuration={0.6}
                rotationAmount={0}
              >
                <ScrollStackItem>
                  <AISolutionCard
                    title="Predictive Enrollment Forecasting"
                    features={[
                      "Analyzes local data & trends",
                      "Seasonal & market prediction",
                      "Actionable insights"
                    ]}
                    image="/assets/forecasting.png"
                  />
                </ScrollStackItem>
                <ScrollStackItem>
                  <AISolutionCard
                    title="Revenue Growth Acceleration"
                    features={[
                      "Dynamic pricing strategies",
                      "Targeted upselling",
                      "Demand prediction"
                    ]}
                    image="/assets/revenue-growth-acceleration.png"
                  />
                </ScrollStackItem>
                <ScrollStackItem>
                  <AISolutionCard
                    title="Enhanced Parent Engagement"
                    features={[
                      "Personalized updates",
                      "Sentiment analysis",
                      "Multi-language support"
                    ]}
                    image="/assets/enhanced-parent-engagement.png"
                  />
                </ScrollStackItem>
              </ScrollStack>
            </div>
          </div>
        </section>

        {/* See It In Action Section (Animated with ContainerScroll) */}
        <DashboardHighlights />

        {/* Testimonials Section */}
        <section className="py-20" style={{ background: "#010205" }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">What Our Clients Say</h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
                Hear from educational leaders who have transformed their admissions with EduConnect.
              </p>
            </div>
            <TestimonialCarousel />
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq-section" style={{ background: "#010205" }} className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Everything you need to know about EduConnect
              </p>
            </motion.div>
            <div className="max-w-3xl mx-auto">
              <AnimatePresence initial={false}>
                {faqItems.map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="mb-4"
                  >
                    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="w-full p-6 text-left flex justify-between items-center hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="font-semibold text-slate-100">{faq.question}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === index ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {openFaq === index && (
                          <motion.div
                            key={faq.question + "-content"}
                            initial={{ opacity: 0, maxHeight: 0 }}
                            animate={{ opacity: 1, maxHeight: 500 }}
                            exit={{ opacity: 0, maxHeight: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="px-6 pb-6 overflow-hidden"
                          >
                            <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>


        {/* Contact Section */}
        <section id="contact" className="py-20" style={{ background: "#010205" }}>
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                Get in Touch
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Have questions about EduConnect? Our team is here to help you transform your institution's admissions process.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-8">
                <div className="rounded-2xl p-8 shadow-lg" style={{ background: '#0e0f12' }}>
                  <h3 className="text-2xl font-semibold mb-6 text-white">
                    Contact Information
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#643ae5] rounded-xl flex items-center justify-center">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Email</p>
                        <a href="mailto:contact@edulead.pro" className="font-medium text-white hover:text-[#ffd700] transition-colors">
                          contact@edulead.pro
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#643ae5] rounded-xl flex items-center justify-center">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Phone</p>
                        <a href="tel:+915551234567" className="font-medium text-white hover:text-[#ffd700] transition-colors">
                          +91 (555) 123-4567
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#643ae5] rounded-xl flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Location</p>
                        <p className="font-medium text-white">
                          Mumbai, India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl p-8 shadow-lg" style={{ background: '#0e0f12' }}>
                  <h3 className="text-2xl font-semibold mb-6 text-white">
                    Business Hours
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Monday - Friday</span>
                      <span className="font-medium text-white">9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Saturday</span>
                      <span className="font-medium text-white">10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Sunday</span>
                      <span className="font-medium text-white">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Contact Form */}
              <div>
                <form onSubmit={handleContactSubmit} className="rounded-2xl p-8 shadow-lg space-y-6" style={{ background: '#0e0f12' }}>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2 text-white">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[#643ae5] bg-[#4a4a5e] text-white focus:ring-2 focus:ring-[#643ae5] focus:border-transparent transition-colors placeholder-white/60"
                      required
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[#643ae5] bg-[#4a4a5e] text-white focus:ring-2 focus:ring-[#643ae5] focus:border-transparent transition-colors placeholder-white/60"
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="institution" className="block text-sm font-medium mb-2 text-white">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      id="institution"
                      value={contactForm.institution}
                      onChange={(e) => setContactForm({ ...contactForm, institution: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[#643ae5] bg-[#4a4a5e] text-white focus:ring-2 focus:ring-[#643ae5] focus:border-transparent transition-colors placeholder-white/60"
                      required
                      placeholder="Your institution"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2 text-white">
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-[#643ae5] bg-[#4a4a5e] text-white focus:ring-2 focus:ring-[#643ae5] focus:border-transparent transition-colors resize-none placeholder-white/60"
                      required
                      placeholder="Type your message..."
                    ></textarea>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#643ae5] hover:bg-[#7a4fff] text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-none"
                  >
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20" style={{ position: 'relative' }}>
          <motion.div
            style={{ backgroundImage, position: 'absolute', inset: 0, zIndex: 0 }}
            aria-hidden="true"
            className="w-full h-full"
          />
          <div className="w-full text-center relative z-10 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
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
                <Button size="lg" variant="outline" className="px-8 py-4 rounded-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#010205] font-bold text-lg transition-colors" onClick={() => setLocation('/pricing')}>
                  View Pricing Plans
                </Button>
              </div>
              {/* Animated Taglines (if present in original) */}
              <RotatingTaglines />
            </motion.div>
          </div>
        </section>

        {/* Footer (from new template, will adapt to your info) */}
        <footer className="bg-[#010205] border-t border-white/10 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* About Section */}
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-4">EduConnect</h3>
                <p className="text-slate-400 mb-6 flex-grow">
                  Empowering educational institutions with AI-driven admissions, predictive analytics, and intelligent marketing.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <Linkedin size={20} />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <Twitter size={20} />
                  </a>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors">
                    <Facebook size={20} />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-white mb-4 text-lg">Quick Links</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="/book-demo" className="hover:text-white transition-colors">Book a Demo</a></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold text-white mb-4 text-lg">Resources</h4>
                <ul className="space-y-3 text-slate-400">
                  <li><a href="#ai-future" className="hover:text-white transition-colors">AI Solutions</a></li>
                  <li><a href="#faq-section" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
                </ul>
              </div>

              {/* Newsletter */}
              <div>
                <h4 className="font-semibold text-white mb-4 text-lg">Stay up to date</h4>
                <p className="text-slate-400 mb-4">Get the latest news and updates from EduConnect.</p>
                <form className="flex w-full items-center rounded-full bg-[#0e0f12] p-1 border border-white/20 max-w-sm">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full appearance-none bg-transparent px-4 py-1 text-white placeholder-slate-400 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    className="flex-shrink-0 rounded-full bg-[#643ae5] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#7a4fff]"
                  >
                    Subscribe
                  </Button>
                </form>
                <div className="mt-8">
                  <h6 className="font-semibold text-white mb-4 text-lg whitespace-nowrap">Have Something To Say?</h6>
                  <FeedbackButton onClick={() => setIsFeedbackFormOpen(true)} />
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500">
              <p className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} EduConnect. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div> {/* Close bg-[#010205] wrapper */}
      <FeedbackForm
        isOpen={isFeedbackFormOpen}
        onClose={() => setIsFeedbackFormOpen(false)}
      />
    </PublicLayout>
  );
}