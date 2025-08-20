// AI Models Configuration
// This file centralizes AI model configurations for easy management

export interface AIModelConfig {
  name: string;
  provider: 'perplexity' | 'openai' | 'anthropic';
  model: string;
  maxTokens: number;
  temperature: number;
  description: string;
  capabilities: string[];
  costPerToken?: number;
  isActive: boolean;
}

export const AI_MODELS: Record<string, AIModelConfig> = {
  // Perplexity Models
  PERPLEXITY_SONAR: {
    name: 'Perplexity Sonar',
    provider: 'perplexity',
    model: 'sonar',
    maxTokens: 4000,
    temperature: 0.7,
    description: 'Fast and efficient model for general queries with web search capabilities',
    capabilities: ['web_search', 'real_time_data', 'general_knowledge'],
    isActive: true,
  },
  PERPLEXITY_SONAR_PRO: {
    name: 'Perplexity Sonar Pro',
    provider: 'perplexity',
    model: 'sonar-pro',
    maxTokens: 4000,
    temperature: 0.7,
    description: 'Advanced model with enhanced reasoning and web search',
    capabilities: ['web_search', 'real_time_data', 'advanced_reasoning', 'complex_analysis'],
    isActive: true,
  },
  PERPLEXITY_SONAR_REASONING: {
    name: 'Perplexity Sonar Reasoning',
    provider: 'perplexity',
    model: 'sonar-reasoning',
    maxTokens: 4000,
    temperature: 0.7,
    description: 'Specialized model for complex reasoning tasks',
    capabilities: ['advanced_reasoning', 'problem_solving', 'analytical_thinking'],
    isActive: true,
  },
  PERPLEXITY_SONAR_REASONING_PRO: {
    name: 'Perplexity Sonar Reasoning Pro',
    provider: 'perplexity',
    model: 'sonar-reasoning-pro',
    maxTokens: 4000,
    temperature: 0.7,
    description: 'Premium reasoning model with enhanced capabilities',
    capabilities: ['advanced_reasoning', 'complex_problem_solving', 'deep_analysis', 'web_search'],
    isActive: true,
  },
};

// Model selection based on use case
export const MODEL_USE_CASES = {
  STUDENT_ANALYSIS: 'PERPLEXITY_SONAR',
  PRICING_OPTIMIZATION: 'PERPLEXITY_SONAR_PRO',
  STAFF_OPTIMIZATION: 'PERPLEXITY_SONAR',
  VIRTUAL_COUNSELOR: 'PERPLEXITY_SONAR',
  COMPLEX_REASONING: 'PERPLEXITY_SONAR_REASONING',
  MARKET_RESEARCH: 'PERPLEXITY_SONAR_PRO',
} as const;

// Helper functions
export function getModelConfig(useCase: keyof typeof MODEL_USE_CASES): AIModelConfig {
  const modelKey = MODEL_USE_CASES[useCase];
  const config = AI_MODELS[modelKey];
  
  if (!config) {
    throw new Error(`Model configuration not found for use case: ${useCase}`);
  }
  
  if (!config.isActive) {
    // Fallback to default active model
    const fallbackModel = Object.values(AI_MODELS).find(model => model.isActive);
    if (!fallbackModel) {
      throw new Error('No active AI models available');
    }
    return fallbackModel;
  }
  
  return config;
}

export function getActiveModels(): AIModelConfig[] {
  return Object.values(AI_MODELS).filter(model => model.isActive);
}

export function getModelsByProvider(provider: AIModelConfig['provider']): AIModelConfig[] {
  return Object.values(AI_MODELS).filter(model => model.provider === provider && model.isActive);
}

// Model validation
export function validateModelName(modelName: string): boolean {
  return Object.values(AI_MODELS).some(model => model.model === modelName && model.isActive);
}

// Default configurations for different scenarios
export const DEFAULT_CONFIGS = {
  EDUCATIONAL_ANALYSIS: {
    temperature: 0.3, // Lower temperature for more consistent analysis
    maxTokens: 2000,
  },
  CREATIVE_CONTENT: {
    temperature: 0.8, // Higher temperature for more creative responses
    maxTokens: 3000,
  },
  FACTUAL_QUERIES: {
    temperature: 0.1, // Very low temperature for factual accuracy
    maxTokens: 1500,
  },
} as const;