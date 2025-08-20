import { 
  Bot, 
  TrendingUp, 
  Brain, 
  Megaphone,
  Target,
  Zap,
  Users,
  BookOpen,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Rocket,
  Shield,
  Star
} from "lucide-react";

export interface AIFeature {
  id: string;
  name: string;
  href: string;
  icon: any;
  description: string;
  category: 'analytics' | 'automation' | 'prediction' | 'communication';
  isActive: boolean;
  comingSoon?: boolean;
}

export const aiFeatures: AIFeature[] = [
  {
    id: 'ai-control-center',
    name: 'AI Control Center',
    href: '/ai-comprehensive',
    icon: Bot,
    description: 'Comprehensive AI analytics',
    category: 'analytics',
    isActive: true,
  },
  {
    id: 'ai-enhanced-hub',
    name: 'AI Enhanced Hub',
    href: '/ai-enhanced',
    icon: TrendingUp,
    description: 'Advanced AI insights',
    category: 'analytics',
    isActive: true,
  },
  {
    id: 'ai-forecasting',
    name: 'AI Forecasting',
    href: '/ai-forecasting',
    icon: Brain,
    description: 'Predictive analytics',
    category: 'prediction',
    isActive: true,
  },
  {
    id: 'ai-marketing',
    name: 'AI Marketing',
    href: '/ai-marketing',
    icon: Megaphone,
    description: 'Smart marketing automation',
    category: 'automation',
    isActive: true,
  },
  // Future AI features can be added here
  {
    id: 'ai-virtual-assistant',
    name: 'Virtual Assistant',
    href: '/ai-assistant',
    icon: MessageSquare,
    description: 'AI-powered virtual assistant',
    category: 'communication',
    isActive: false,
    comingSoon: true,
  },
  {
    id: 'ai-performance-optimizer',
    name: 'Performance Optimizer',
    href: '/ai-performance',
    icon: Rocket,
    description: 'AI-driven performance optimization',
    category: 'analytics',
    isActive: false,
    comingSoon: true,
  },
  {
    id: 'ai-security-monitor',
    name: 'Security Monitor',
    href: '/ai-security',
    icon: Shield,
    description: 'AI-powered security monitoring',
    category: 'analytics',
    isActive: false,
    comingSoon: true,
  },
];

// Helper functions
export const getActiveAIFeatures = (): AIFeature[] => {
  return aiFeatures.filter(feature => feature.isActive);
};

export const getAIFeaturesByCategory = (category: AIFeature['category']): AIFeature[] => {
  return aiFeatures.filter(feature => feature.category === category && feature.isActive);
};

export const getComingSoonFeatures = (): AIFeature[] => {
  return aiFeatures.filter(feature => feature.comingSoon);
};

export const isAIFeaturePath = (path: string): boolean => {
  return aiFeatures.some(feature => feature.href === path);
};