import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Landmark,
  Zap,
  UserCheck,
  Mail,
  GraduationCap,
  Phone,
  MessageSquare,
  Calendar,
  FileText,
  Users,
  BarChart3,
  BrainCircuit,
  User,
  Shield,
  UserPlus,
  Send,
  TrendingUp,
  Bot,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';

// A new sub-component for the animated row
const AnimatedIconRow = ({
  icons,
  direction = "left",
}: {
  icons: { icon: JSX.Element }[];
  direction: "left" | "right";
}) => {
  const duplicatedIcons = [...icons, ...icons];
  const duration = 10; // Adjust for speed

  const marqueeVariants = {
    animate: {
      x: direction === "left" ? ["0%", "-100%"] : ["-100%", "0%"],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: duration,
          ease: "linear",
        },
      },
    },
  };

  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="flex"
        variants={marqueeVariants}
        animate="animate"
      >
        {duplicatedIcons.map((service, index) => (
          <div
            key={index}
            className="flex-shrink-0 bg-gray-700/50 rounded-lg flex items-center justify-center p-4 text-white mx-2"
          >
            {service.icon}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const DashboardHighlights = () => {
  const [, setLocation] = useLocation();

  const highlights = [
    "AI-Powered Lead Scoring",
    "Predictive Enrollment Analytics",
    "Automated Communication Workflows",
    "Real-time Performance Dashboards",
    "Comprehensive Reporting Tools",
    "Seamless ERP Integration"
  ];

  const integrationServices = [
    { icon: <GraduationCap className="text-indigo-400" /> },
    { icon: <Users className="text-sky-400" /> },
    { icon: <Mail className="text-rose-400" /> },
    { icon: <Phone className="text-amber-400" /> },
    { icon: <MessageSquare className="text-emerald-400" /> },
    { icon: <Calendar className="text-violet-400" /> },
    { icon: <FileText className="text-pink-400" /> },
    { icon: <BarChart3 className="text-teal-400" /> },
    { icon: <Landmark className="text-indigo-400" /> },
    { icon: <Zap className="text-sky-400" /> },
    { icon: <Shield className="text-rose-400" /> },
    { icon: <User className="text-amber-400" /> },
    { icon: <GraduationCap className="text-emerald-400" /> },
    { icon: <MessageSquare className="text-violet-400" /> },
    { icon: <Zap className="text-pink-400" /> },
    { icon: <Users className="text-teal-400" /> },
  ];

  const topRowIcons = integrationServices.slice(0, 8);
  const bottomRowIcons = integrationServices.slice(8, 16);

  return (
    <section id="dashboard-highlights" className="py-24 bg-[#010205]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-white">
            Dashboard Highlights
          </h2>
          <p className="mt-4 text-xl text-slate-300 max-w-2xl mx-auto">
            Centralized command, intelligent insights – your complete admissions
            powerhouse.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            className="lg:col-span-2 bg-[#0e0f12] p-12 rounded-3xl flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <AnimatedIconRow icons={topRowIcons} direction="left" />
            </div>
            <div className="mb-8">
              <AnimatedIconRow icons={bottomRowIcons} direction="right" />
            </div>
            <div className="mt-auto">
              <h3 className="text-white font-bold text-2xl">
                Unified Platform Integration
              </h3>
              <p className="text-slate-400 mt-2">
                Connect seamlessly with your existing ERP, communication
                channels, and student management systems.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="lg:row-span-2 rounded-3xl overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-purple-500 to-fuchsia-500 p-8 flex-grow flex flex-col">
              <div>
                <h3 className="text-white font-bold text-2xl">
                  Visualize Your Admissions Funnel
                </h3>
                <p className="text-purple-200 mt-2">
                  Gain clear insights into your admission trends with rich
                  visuals tracking leads from inquiry to enrollment.
                </p>
              </div>
              <div className="mt-8 space-y-4 flex-grow flex flex-col justify-center">
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <Users size={20} className="text-white" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-white font-semibold text-sm">
                      1200+ Inquiries
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-1.5 mt-1 overflow-hidden">
                      <motion.div
                        className="bg-white h-1.5 rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        transition={{
                          duration: 1,
                          ease: "easeInOut",
                          delay: 0.5,
                        }}
                        viewport={{ once: true }}
                      ></motion.div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-white font-semibold text-sm">
                      850+ Applications
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-1.5 mt-1 overflow-hidden">
                      <motion.div
                        className="bg-white h-1.5 rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "70%" }}
                        transition={{
                          duration: 1,
                          ease: "easeInOut",
                          delay: 0.6,
                        }}
                        viewport={{ once: true }}
                      ></motion.div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <UserCheck size={20} className="text-white" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-white font-semibold text-sm">
                      450+ Interviews
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-1.5 mt-1 overflow-hidden">
                      <motion.div
                        className="bg-white h-1.5 rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "35%" }}
                        transition={{
                          duration: 1,
                          ease: "easeInOut",
                          delay: 0.7,
                        }}
                        viewport={{ once: true }}
                      ></motion.div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <GraduationCap size={20} className="text-white" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-white font-semibold text-sm">
                      200+ Enrolled
                    </p>
                    <div className="w-full bg-white/20 rounded-full h-1.5 mt-1 overflow-hidden">
                      <motion.div
                        className="bg-white h-1.5 rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "15%" }}
                        transition={{
                          duration: 1,
                          ease: "easeInOut",
                          delay: 0.8,
                        }}
                        viewport={{ once: true }}
                      ></motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            <div className="bg-[#0e0f12] px-6 py-12">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1 rounded-md">
                    <BrainCircuit className="text-black" />
                  </div>
                  <span className="text-white font-bold text-lg">EduLead AI</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-purple-400" />
                    <span className="text-white">AI Insights</span>
                  </div>
                  <Badge variant="secondary" className="bg-gray-700 text-white">
                    ⌘ 1
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Bot size={20} className="text-blue-400" />
                  <span className="text-white">AI Assistant</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-fuchsia-400" />
                  <span className="text-white">AI Automation</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-full"
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-purple-600 to-rose-500 p-8 rounded-3xl h-full flex flex-col">
                <h3 className="text-white font-bold text-2xl">Urgent Tasks</h3>
                <p className="text-purple-200 mt-2 mb-6">
                  Key follow-ups and actions that need your immediate attention.
                </p>
                <div className="bg-black/30 backdrop-blur-sm p-6 rounded-2xl flex-grow space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between text-white mb-2">
                      <div className="flex items-center gap-3">
                        <UserPlus size={16} className="text-pink-300" />
                        <span className="text-sm">Follow up with XYZ</span>
                      </div>
                      <span className="text-xs font-bold text-red-400">
                        HIGH PRIORITY
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <motion.div
                        className="bg-white h-1 rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "90%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        viewport={{ once: true }}
                      ></motion.div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between text-white mb-2">
                      <div className="flex items-center gap-3">
                        <Send size={16} className="text-indigo-300" />
                        <span className="text-sm">
                          Send Prospectus - Batch 2
                        </span>
                      </div>
                      <span className="text-xs text-slate-300">
                        Due in 2 days
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <motion.div
                        className="bg-white h-1 rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "50%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        viewport={{ once: true }}
                      ></motion.div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between text-white mb-2">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-amber-300" />
                        <span className="text-sm">
                          Review new lead applications
                        </span>
                      </div>
                      <span className="text-xs text-slate-300">3 pending</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <motion.div
                        className="bg-white h-1 rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "75%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        viewport={{ once: true }}
                      ></motion.div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center justify-between text-white mb-2">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-emerald-300" />
                        <span className="text-sm">
                          Schedule demo for XYZ School
                        </span>
                      </div>
                      <span className="text-xs text-slate-300">Tomorrow</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <motion.div
                        className="bg-white h-1 rounded-full"
                        initial={{ width: "0%" }}
                        whileInView={{ width: "20%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        viewport={{ once: true }}
                      ></motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-[#0e0f12] p-8 rounded-3xl h-full flex flex-col">
                <div className="space-y-4 mb-6">
                  <motion.div
                    className="flex items-center gap-4 bg-white/5 p-3 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <User className="text-sky-400" />
                    <div>
                      <h4 className="text-white font-semibold">Counselor</h4>
                      <p className="text-xs text-slate-400">
                        AI-powered lead management & automated follow-ups.
                      </p>
                    </div>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-4 bg-white/5 p-3 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <Shield className="text-violet-400" />
                    <div>
                      <h4 className="text-white font-semibold">Admin</h4>
                      <p className="text-xs text-slate-400">
                        360° institute overview with predictive analytics.
                      </p>
                    </div>
                  </motion.div>
                  <motion.div
                    className="flex items-center gap-4 bg-white/5 p-3 rounded-lg"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <Mail className="text-rose-400" />
                    <div>
                      <h4 className="text-white font-semibold">Marketing</h4>
                      <p className="text-xs text-slate-400">
                        Data-driven campaign optimization & ROI tracking.
                      </p>
                    </div>
                  </motion.div>
                </div>

                <h3 className="text-white font-bold text-3xl tracking-tight">
                  Personalized AI Dashboards
                </h3>
                <p className="text-slate-400 mt-2">
                  Empowering every team member with role-specific insights and automated workflows.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardHighlights; 