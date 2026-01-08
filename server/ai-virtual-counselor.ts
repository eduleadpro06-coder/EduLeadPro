// Intelligent Virtual Counselor & 24/7 Support System
import { eq, sql, desc, and, gte, lt } from "drizzle-orm";
import { db } from "./lib/db.js";
import { students, leads, staff } from "../shared/schema.js";

// Virtual Counselor Interfaces
export interface VirtualCounselorResponse {
  message: string;
  responseType: 'direct_answer' | 'escalation' | 'information_request' | 'appointment_booking';
  confidence: number; // 0-100
  suggestedActions: SuggestedAction[];
  relatedResources: Resource[];
  escalationRequired: boolean;
  escalationReason?: string;
  assignedCounselor?: string;
  followUpRequired: boolean;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
}

export interface SuggestedAction {
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  department: string;
}

export interface Resource {
  title: string;
  type: 'document' | 'link' | 'contact' | 'form';
  url?: string;
  description: string;
  relevanceScore: number;
}

export interface ConversationContext {
  userId?: number;
  userType: 'student' | 'parent' | 'lead' | 'anonymous';
  sessionId: string;
  conversationHistory: ConversationMessage[];
  currentTopic: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  satisfactionScore?: number;
}

export interface ConversationMessage {
  id: string;
  timestamp: string;
  sender: 'user' | 'ai' | 'human_counselor';
  message: string;
  intent: string;
  entities: Entity[];
  handled: boolean;
}

export interface Entity {
  type: 'course' | 'fee' | 'date' | 'person' | 'amount' | 'location';
  value: string;
  confidence: number;
}

export interface CounselorRouting {
  routeTo: 'ai' | 'human' | 'specialist';
  counselorType: 'academic' | 'financial' | 'admissions' | 'technical' | 'general';
  urgency: 'immediate' | 'same_day' | 'next_day' | 'scheduled';
  estimatedWaitTime: string;
  availableCounselors: AvailableCounselor[];
}

export interface AvailableCounselor {
  counselorId: number;
  name: string;
  specialization: string[];
  currentLoad: number; // Number of active cases
  averageRating: number;
  nextAvailable: string;
}

export interface SentimentAnalysis {
  overall: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  emotions: {
    frustration: number;
    satisfaction: number;
    confusion: number;
    urgency: number;
    confidence: number;
  };
  keyPhrases: string[];
  escalationTriggers: string[];
  improvementSuggestions: string[];
}

// Intent Recognition System
const INTENT_PATTERNS = {
  fee_inquiry: [
    'fee', 'cost', 'price', 'payment', 'tuition', 'scholarship', 'discount',
    'installment', 'emi', 'financial aid', 'money'
  ],
  admission_inquiry: [
    'admission', 'enroll', 'apply', 'eligibility', 'requirements', 'documents',
    'entrance', 'selection', 'criteria', 'deadline'
  ],
  course_inquiry: [
    'course', 'curriculum', 'syllabus', 'subjects', 'duration', 'schedule',
    'faculty', 'placement', 'career', 'job'
  ],
  technical_issue: [
    'login', 'password', 'access', 'portal', 'website', 'error', 'problem',
    'bug', 'not working', 'unable'
  ],
  complaint: [
    'complaint', 'issue', 'problem', 'dissatisfied', 'angry', 'frustrated',
    'poor service', 'bad experience', 'unhappy'
  ],
  emergency: [
    'urgent', 'emergency', 'immediate', 'asap', 'critical', 'help',
    'stuck', 'deadline', 'exam'
  ]
};

// AI Virtual Counselor Main Function
export async function processVirtualCounselorQuery(
  message: string,
  context: ConversationContext
): Promise<VirtualCounselorResponse> {
  try {
    // Analyze message intent and entities
    const intent = recognizeIntent(message);
    const entities = extractEntities(message);
    const sentiment = analyzeSentiment(message);

    // Update conversation context
    const updatedContext = updateConversationContext(context, message, intent, entities);

    // Determine if escalation is needed
    const escalationDecision = shouldEscalate(message, intent, sentiment, updatedContext);

    if (escalationDecision.shouldEscalate) {
      return await handleEscalation(message, intent, escalationDecision, updatedContext);
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(message, intent, entities, updatedContext);

    return {
      message: aiResponse.message,
      responseType: aiResponse.responseType,
      confidence: aiResponse.confidence,
      suggestedActions: aiResponse.suggestedActions,
      relatedResources: aiResponse.relatedResources,
      escalationRequired: false,
      followUpRequired: aiResponse.followUpRequired,
      sentiment: sentiment.overall === 'very_negative' || sentiment.overall === 'negative' ? 'negative' :
        sentiment.overall === 'very_positive' || sentiment.overall === 'positive' ? 'positive' :
          sentiment.emotions.urgency > 0.7 ? 'urgent' : 'neutral'
    };

  } catch (error) {
    console.error('Error processing virtual counselor query:', error);
    return getErrorResponse();
  }
}

// Intent Recognition
function recognizeIntent(message: string): string {
  const normalizedMessage = message.toLowerCase();
  let maxScore = 0;
  let detectedIntent = 'general_inquiry';

  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    const score = keywords.reduce((acc, keyword) => {
      return normalizedMessage.includes(keyword) ? acc + 1 : acc;
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      detectedIntent = intent;
    }
  }

  return detectedIntent;
}

// Entity Extraction
function extractEntities(message: string): Entity[] {
  const entities: Entity[] = [];
  const normalizedMessage = message.toLowerCase();

  // Extract amounts (numbers with currency or fee-related context)
  const amountRegex = /₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rupees?|rs?|₹|lakh?s?|crores?)?/gi;
  let match;
  while ((match = amountRegex.exec(message)) !== null) {
    entities.push({
      type: 'amount',
      value: match[1],
      confidence: 0.8
    });
  }

  // Extract dates
  const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/gi;
  while ((match = dateRegex.exec(message)) !== null) {
    entities.push({
      type: 'date',
      value: match[0],
      confidence: 0.7
    });
  }

  // Extract course names
  const courseKeywords = ['engineering', 'medical', 'mba', 'btech', 'mbbs', 'bca', 'mca', 'bba'];
  courseKeywords.forEach(course => {
    if (normalizedMessage.includes(course)) {
      entities.push({
        type: 'course',
        value: course,
        confidence: 0.9
      });
    }
  });

  return entities;
}

// Sentiment Analysis
function analyzeSentiment(message: string): SentimentAnalysis {
  const normalizedMessage = message.toLowerCase();

  // Positive indicators
  const positiveWords = ['good', 'great', 'excellent', 'satisfied', 'happy', 'thank', 'appreciate'];
  const positiveScore = positiveWords.reduce((score, word) =>
    normalizedMessage.includes(word) ? score + 1 : score, 0);

  // Negative indicators
  const negativeWords = ['bad', 'terrible', 'angry', 'frustrated', 'disappointed', 'worst', 'hate'];
  const negativeScore = negativeWords.reduce((score, word) =>
    normalizedMessage.includes(word) ? score + 1 : score, 0);

  // Urgency indicators
  const urgencyWords = ['urgent', 'asap', 'immediately', 'emergency', 'deadline', 'critical'];
  const urgencyScore = urgencyWords.reduce((score, word) =>
    normalizedMessage.includes(word) ? score + 1 : score, 0);

  // Frustration indicators
  const frustrationWords = ['confused', 'stuck', 'unable', 'not working', 'problem', 'issue'];
  const frustrationScore = frustrationWords.reduce((score, word) =>
    normalizedMessage.includes(word) ? score + 1 : score, 0);

  // Overall sentiment
  let overall: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
  if (positiveScore > negativeScore + 1) {
    overall = positiveScore > 2 ? 'very_positive' : 'positive';
  } else if (negativeScore > positiveScore + 1) {
    overall = negativeScore > 2 ? 'very_negative' : 'negative';
  } else {
    overall = 'neutral';
  }

  return {
    overall,
    emotions: {
      frustration: Math.min(1, frustrationScore / 3),
      satisfaction: Math.min(1, positiveScore / 3),
      confusion: normalizedMessage.includes('confused') || normalizedMessage.includes('understand') ? 0.8 : 0.2,
      urgency: Math.min(1, urgencyScore / 2),
      confidence: positiveScore > 0 ? 0.8 : 0.4
    },
    keyPhrases: extractKeyPhrases(message),
    escalationTriggers: getEscalationTriggers(normalizedMessage),
    improvementSuggestions: []
  };
}

// Extract key phrases
function extractKeyPhrases(message: string): string[] {
  const phrases: string[] = [];
  const words = message.toLowerCase().split(/\s+/);

  // Look for important bigrams and trigrams
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (bigram.includes('fee') || bigram.includes('admission') || bigram.includes('course')) {
      phrases.push(bigram);
    }
  }

  return phrases.slice(0, 3); // Return top 3 phrases
}

// Get escalation triggers
function getEscalationTriggers(message: string): string[] {
  const triggers: string[] = [];

  const escalationKeywords = {
    'complaint': 'Customer complaint detected',
    'angry': 'Emotional escalation needed',
    'manager': 'Management escalation requested',
    'legal': 'Legal issue mentioned',
    'refund': 'Refund request',
    'cancel': 'Cancellation request'
  };

  for (const [keyword, trigger] of Object.entries(escalationKeywords)) {
    if (message.includes(keyword)) {
      triggers.push(trigger);
    }
  }

  return triggers;
}

// Update conversation context
function updateConversationContext(
  context: ConversationContext,
  message: string,
  intent: string,
  entities: Entity[]
): ConversationContext {
  const newMessage: ConversationMessage = {
    id: `msg_${Date.now()}`,
    timestamp: new Date().toISOString(),
    sender: 'user',
    message,
    intent,
    entities,
    handled: false
  };

  return {
    ...context,
    conversationHistory: [...context.conversationHistory, newMessage],
    currentTopic: intent,
    urgencyLevel: entities.some(e => e.type === 'amount') ? 'high' : 'medium'
  };
}

// Should escalate decision
function shouldEscalate(
  message: string,
  intent: string,
  sentiment: SentimentAnalysis,
  context: ConversationContext
): { shouldEscalate: boolean; reason?: string; type?: string } {
  // Check for explicit escalation requests
  if (message.toLowerCase().includes('human') || message.toLowerCase().includes('manager')) {
    return { shouldEscalate: true, reason: 'Human agent requested', type: 'general' };
  }

  // Check sentiment-based escalation
  if (sentiment.overall === 'very_negative' || sentiment.emotions.frustration > 0.8) {
    return { shouldEscalate: true, reason: 'Negative sentiment detected', type: 'general' };
  }

  // Check urgency-based escalation
  if (sentiment.emotions.urgency > 0.8) {
    return { shouldEscalate: true, reason: 'High urgency detected', type: 'urgent' };
  }

  // Check complex intent escalation
  const complexIntents = ['complaint', 'emergency'];
  if (complexIntents.includes(intent)) {
    return { shouldEscalate: true, reason: 'Complex issue requiring human intervention', type: 'specialist' };
  }

  // Check conversation length escalation
  if (context.conversationHistory.length > 5 && !context.conversationHistory.some(msg => msg.handled)) {
    return { shouldEscalate: true, reason: 'Extended conversation without resolution', type: 'general' };
  }

  return { shouldEscalate: false };
}

// Handle escalation
async function handleEscalation(
  message: string,
  intent: string,
  escalation: any,
  context: ConversationContext
): Promise<VirtualCounselorResponse> {
  const routing = await getCounselorRouting(intent, escalation.type, context);

  return {
    message: generateEscalationMessage(routing),
    responseType: 'escalation',
    confidence: 95,
    suggestedActions: [
      {
        action: 'wait_for_counselor',
        description: 'Please wait while we connect you to a human counselor',
        priority: 'high',
        estimatedTime: routing.estimatedWaitTime,
        department: routing.counselorType
      }
    ],
    relatedResources: [],
    escalationRequired: true,
    escalationReason: escalation.reason,
    assignedCounselor: routing.availableCounselors[0]?.name,
    followUpRequired: true,
    sentiment: 'urgent'
  };
}

// Get counselor routing
async function getCounselorRouting(
  intent: string,
  escalationType: string,
  context: ConversationContext
): Promise<CounselorRouting> {
  // Map intent to counselor type
  const intentToCounselorMap: Record<string, string> = {
    'fee_inquiry': 'financial',
    'admission_inquiry': 'admissions',
    'course_inquiry': 'academic',
    'technical_issue': 'technical',
    'complaint': 'general',
    'emergency': 'general'
  };

  const counselorType = intentToCounselorMap[intent] || 'general';

  // Get available counselors (simplified)
  const availableCounselors = await getAvailableCounselors(counselorType);

  return {
    routeTo: 'human',
    counselorType: counselorType as any,
    urgency: escalationType === 'urgent' ? 'immediate' : 'same_day',
    estimatedWaitTime: availableCounselors.length > 0 ? '5-10 minutes' : '30-60 minutes',
    availableCounselors
  };
}

// Get available counselors
async function getAvailableCounselors(type: string): Promise<AvailableCounselor[]> {
  try {
    const counselors = await db
      .select()
      .from(staff)
      .where(eq(staff.isActive, true))
      .limit(3);

    return counselors.map(counselor => ({
      counselorId: counselor.id,
      name: counselor.name,
      specialization: [type],
      currentLoad: Math.floor(Math.random() * 5), // Simulated load
      averageRating: 4.2 + Math.random() * 0.8,
      nextAvailable: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error getting available counselors:', error);
    return [];
  }
}

// Generate escalation message
function generateEscalationMessage(routing: CounselorRouting): string {
  const messages = [
    `I understand you need specialized assistance. I'm connecting you to our ${routing.counselorType} team.`,
    `Let me transfer you to one of our human counselors who can better assist you.`,
    `I'm escalating your query to our expert team for personalized assistance.`
  ];

  const baseMessage = messages[Math.floor(Math.random() * messages.length)];

  if (routing.availableCounselors.length > 0) {
    return `${baseMessage} ${routing.availableCounselors[0].name} will be with you shortly. Estimated wait time: ${routing.estimatedWaitTime}.`;
  }

  return `${baseMessage} Please hold while we find the next available counselor. Estimated wait time: ${routing.estimatedWaitTime}.`;
}

// Generate AI response
async function generateAIResponse(
  message: string,
  intent: string,
  entities: Entity[],
  context: ConversationContext
): Promise<{
  message: string;
  responseType: 'direct_answer' | 'information_request' | 'appointment_booking';
  confidence: number;
  suggestedActions: SuggestedAction[];
  relatedResources: Resource[];
  followUpRequired: boolean;
}> {
  const responseGenerators: Record<string, () => any> = {
    'fee_inquiry': () => generateFeeResponse(entities),
    'admission_inquiry': () => generateAdmissionResponse(entities),
    'course_inquiry': () => generateCourseResponse(entities),
    'technical_issue': () => generateTechnicalResponse(message),
    'general_inquiry': () => generateGeneralResponse(message)
  };

  const generator = responseGenerators[intent] || responseGenerators['general_inquiry'];
  return generator();
}

// Generate fee response
function generateFeeResponse(entities: Entity[]) {
  const courseEntity = entities.find(e => e.type === 'course');
  const course = courseEntity ? courseEntity.value : 'our programs';

  return {
    message: `Our fee structure for ${course} varies based on the specific program and payment plan. Here's what I can tell you:

    🎓 Standard Programs: ₹60,000 - ₹1,20,000 per year
    💰 Payment Plans: EMI options available (3, 6, 12 months)
    🏆 Scholarships: Merit and need-based scholarships up to 50%
    
    Would you like me to provide detailed fee information for a specific course or connect you with our financial counselor?`,
    responseType: 'direct_answer' as const,
    confidence: 85,
    suggestedActions: [
      {
        action: 'schedule_financial_counseling',
        description: 'Schedule a call with our financial counselor',
        priority: 'medium' as const,
        estimatedTime: '15-30 minutes',
        department: 'Financial Aid'
      },
      {
        action: 'view_payment_plans',
        description: 'Explore available EMI and payment options',
        priority: 'high' as const,
        estimatedTime: '5 minutes',
        department: 'Admissions'
      }
    ],
    relatedResources: [
      {
        title: 'Fee Structure PDF',
        type: 'document' as const,
        description: 'Complete fee breakdown for all programs',
        relevanceScore: 95
      },
      {
        title: 'EMI Calculator',
        type: 'link' as const,
        url: '/emi-calculator',
        description: 'Calculate your monthly payment options',
        relevanceScore: 90
      }
    ],
    followUpRequired: true
  };
}

// Generate admission response
function generateAdmissionResponse(entities: Entity[]) {
  const courseEntity = entities.find(e => e.type === 'course');
  const course = courseEntity ? courseEntity.value : 'our programs';

  return {
    message: `Great! I'd be happy to help with admission information for ${course}. Here's what you need to know:

    📋 Eligibility: 10+2 (or equivalent) for undergraduate programs
    📅 Application Deadline: Rolling admissions (apply anytime)
    📄 Required Documents: 
        • Academic transcripts
        • Identity proof
        • Passport-size photographs
    
    💻 Application Process: Online application available 24/7
    
    Would you like me to start your application process or schedule a call with our admissions counselor?`,
    responseType: 'direct_answer' as const,
    confidence: 90,
    suggestedActions: [
      {
        action: 'start_application',
        description: 'Begin your online application',
        priority: 'high' as const,
        estimatedTime: '20-30 minutes',
        department: 'Admissions'
      },
      {
        action: 'schedule_counseling',
        description: 'Book a consultation with admissions counselor',
        priority: 'medium' as const,
        estimatedTime: '30 minutes',
        department: 'Admissions'
      }
    ],
    relatedResources: [
      {
        title: 'Admission Requirements',
        type: 'document' as const,
        description: 'Complete eligibility and document requirements',
        relevanceScore: 98
      },
      {
        title: 'Online Application Portal',
        type: 'link' as const,
        url: '/apply',
        description: 'Start your application immediately',
        relevanceScore: 95
      }
    ],
    followUpRequired: true
  };
}

// Generate course response
function generateCourseResponse(entities: Entity[]) {
  return {
    message: `I'm excited to share information about our courses! We offer comprehensive programs designed for industry readiness:

    🔬 Engineering Programs: Computer Science, Electronics, Mechanical
    🏥 Medical Programs: MBBS, Nursing, Pharmacy
    💼 Management Programs: MBA, BBA, Digital Marketing
    
    Each program includes:
    ✅ Industry-relevant curriculum
    ✅ Experienced faculty
    ✅ Placement assistance
    ✅ Practical training
    
    Which specific course interests you? I can provide detailed curriculum and career prospects.`,
    responseType: 'information_request' as const,
    confidence: 88,
    suggestedActions: [
      {
        action: 'explore_curriculum',
        description: 'View detailed course curriculum',
        priority: 'high' as const,
        estimatedTime: '10 minutes',
        department: 'Academic'
      },
      {
        action: 'speak_to_faculty',
        description: 'Connect with faculty members',
        priority: 'medium' as const,
        estimatedTime: '30 minutes',
        department: 'Academic'
      }
    ],
    relatedResources: [
      {
        title: 'Course Catalog',
        type: 'document' as const,
        description: 'Complete list of programs and specializations',
        relevanceScore: 92
      },
      {
        title: 'Virtual Campus Tour',
        type: 'link' as const,
        url: '/virtual-tour',
        description: 'Experience our facilities online',
        relevanceScore: 85
      }
    ],
    followUpRequired: true
  };
}

// Generate technical response
function generateTechnicalResponse(message: string) {
  return {
    message: `I understand you're experiencing a technical issue. Let me help you resolve this quickly:

    🔧 Common Solutions:
    • Clear your browser cache and cookies
    • Try using a different browser (Chrome, Firefox, Safari)
    • Ensure you have a stable internet connection
    • Disable browser extensions temporarily
    
    If the issue persists, I can connect you directly with our technical support team for immediate assistance.
    
    What specific problem are you encountering?`,
    responseType: 'direct_answer' as const,
    confidence: 75,
    suggestedActions: [
      {
        action: 'contact_tech_support',
        description: 'Get immediate technical assistance',
        priority: 'high' as const,
        estimatedTime: '5-10 minutes',
        department: 'Technical Support'
      },
      {
        action: 'try_alternative_access',
        description: 'Access through mobile app or phone',
        priority: 'medium' as const,
        estimatedTime: '2 minutes',
        department: 'Technical Support'
      }
    ],
    relatedResources: [
      {
        title: 'Technical FAQ',
        type: 'document' as const,
        description: 'Common technical issues and solutions',
        relevanceScore: 88
      }
    ],
    followUpRequired: true
  };
}

// Generate general response
function generateGeneralResponse(message: string) {
  return {
    message: `Thank you for reaching out! I'm here to help with any questions about our educational programs and services.

    I can assist you with:
    🎓 Course information and admissions
    💰 Fee structures and payment plans
    📞 Scheduling counselor appointments
    🔧 Technical support
    📋 Application process guidance
    
    What specific information can I help you find today?`,
    responseType: 'information_request' as const,
    confidence: 70,
    suggestedActions: [
      {
        action: 'explore_programs',
        description: 'Browse our course offerings',
        priority: 'medium' as const,
        estimatedTime: '10 minutes',
        department: 'Admissions'
      },
      {
        action: 'schedule_consultation',
        description: 'Book a personalized consultation',
        priority: 'high' as const,
        estimatedTime: '30 minutes',
        department: 'General'
      }
    ],
    relatedResources: [
      {
        title: 'Institution Overview',
        type: 'document' as const,
        description: 'Learn about our programs, faculty, and facilities',
        relevanceScore: 80
      }
    ],
    followUpRequired: false
  };
}

// Get error response
function getErrorResponse(): VirtualCounselorResponse {
  return {
    message: `I apologize, but I'm experiencing a temporary issue. Let me connect you with a human counselor who can assist you immediately.

    In the meantime, you can:
    📞 Call us directly at +91-XXXX-XXXX
    📧 Email us at eduleadpro06@gmail.com
    💬 Use our live chat feature
    
    A counselor will be with you shortly.`,
    responseType: 'escalation',
    confidence: 100,
    suggestedActions: [
      {
        action: 'direct_contact',
        description: 'Call or email for immediate assistance',
        priority: 'high',
        estimatedTime: 'Immediate',
        department: 'General'
      }
    ],
    relatedResources: [],
    escalationRequired: true,
    escalationReason: 'System error',
    followUpRequired: true,
    sentiment: 'neutral'
  };
}

// Analyze conversation satisfaction
export async function analyzeConversationSatisfaction(
  context: ConversationContext
): Promise<{
  satisfactionScore: number;
  issuesResolved: number;
  avgResponseTime: number;
  improvementAreas: string[];
}> {
  const { conversationHistory } = context;
  let satisfactionScore = 80; // Base score

  // Analyze conversation flow
  const userMessages = conversationHistory.filter(msg => msg.sender === 'user');
  const aiMessages = conversationHistory.filter(msg => msg.sender === 'ai');

  // Check resolution rate
  const resolvedMessages = conversationHistory.filter(msg => msg.handled);
  const resolutionRate = resolvedMessages.length / userMessages.length;
  satisfactionScore += (resolutionRate - 0.5) * 20;

  // Check response relevance (based on intent matching)
  const relevantResponses = aiMessages.filter(msg =>
    msg.message.length > 50 && !msg.message.includes('I don\'t understand')
  );
  const relevanceRate = relevantResponses.length / aiMessages.length;
  satisfactionScore += (relevanceRate - 0.7) * 15;

  // Identify improvement areas
  const improvementAreas: string[] = [];
  if (resolutionRate < 0.7) {
    improvementAreas.push('Improve issue resolution rate');
  }
  if (relevanceRate < 0.8) {
    improvementAreas.push('Enhance response relevance');
  }
  if (conversationHistory.length > 8) {
    improvementAreas.push('Reduce conversation length');
  }

  return {
    satisfactionScore: Math.max(0, Math.min(100, satisfactionScore)),
    issuesResolved: resolvedMessages.length,
    avgResponseTime: 2.3, // Simulated average response time in seconds
    improvementAreas
  };
}