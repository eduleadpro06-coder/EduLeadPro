// Enhanced Perplexity AI Integration for Educational Intelligence
import 'dotenv/config';
import { getModelConfig, MODEL_USE_CASES, DEFAULT_CONFIGS } from './config/ai-models';

export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PerplexityRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: 'month' | 'week' | 'day' | 'hour';
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

class PerplexityAI {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai/chat/completions';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }
  }

  async query(request: PerplexityRequest): Promise<PerplexityResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      throw error;
    }
  }

  // Educational Student Success Analysis
  async analyzeStudentSuccessPrediction(studentData: any): Promise<{
    successProbability: number;
    riskFactors: string[];
    recommendations: string[];
    confidence: number;
  }> {
    const modelConfig = getModelConfig('STUDENT_ANALYSIS');
    const defaultConfig = DEFAULT_CONFIGS.EDUCATIONAL_ANALYSIS;
    
    const request: PerplexityRequest = {
      model: modelConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are an educational data analyst specializing in student success prediction. Analyze student data and provide evidence-based insights for academic intervention.'
        },
        {
          role: 'user',
          content: `Analyze this student's profile for success prediction:
          
Academic Performance: ${studentData.academicAverage || 'N/A'}%
Attendance Rate: ${studentData.attendanceRate || 'N/A'}%
Engagement Level: ${studentData.engagementScore || 'N/A'}/100
Family Financial Status: ${studentData.familyIncome || 'N/A'}
Payment History: ${studentData.paymentStatus || 'Current'}
Extracurricular Participation: ${studentData.extracurriculars || 'Limited'}
Previous Academic Issues: ${studentData.previousIssues || 'None'}

Provide:
1. Success probability (0-100)
2. Top 3 risk factors
3. Specific intervention recommendations
4. Confidence level in prediction (0-100)

Base your analysis on current educational research and proven intervention strategies.`
        }
      ],
      temperature: defaultConfig.temperature,
      max_tokens: defaultConfig.maxTokens,
      search_recency_filter: 'month'
    };

    const response = await this.query(request);
    const content = response.choices[0]?.message?.content || '';
    
    return this.parseStudentAnalysis(content);
  }

  // Dynamic Course Pricing Intelligence
  async generatePricingRecommendations(courseData: any, marketData: any): Promise<{
    recommendedPrice: number;
    priceChangePercentage: number;
    marketJustification: string;
    demandLevel: string;
    competitorAnalysis: string;
  }> {
    const modelConfig = getModelConfig('PRICING_OPTIMIZATION');
    const defaultConfig = DEFAULT_CONFIGS.EDUCATIONAL_ANALYSIS;
    
    const request: PerplexityRequest = {
      model: modelConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are an educational market analyst specializing in course pricing optimization. Provide data-driven pricing recommendations based on market conditions and demand patterns.'
        },
        {
          role: 'user',
          content: `Analyze optimal pricing for this educational course:

Course: ${courseData.name}
Current Price: ₹${courseData.currentPrice}
Duration: ${courseData.duration}
Level: ${courseData.level}
Department: ${courseData.department}
Current Enrollment: ${courseData.currentEnrollment}/${courseData.capacity}
Historical Conversion Rate: ${marketData.conversionRate}%
Regional Competition: ${marketData.competitors} similar courses
Market Demand Score: ${marketData.demandScore}/100
Economic Conditions: ${marketData.economicCondition}

Provide specific recommendations for:
1. Optimal price point (₹)
2. Percentage change from current price
3. Market justification with data
4. Demand level assessment
5. Competitive positioning analysis

Focus on maximizing both enrollment and revenue while maintaining educational accessibility.`
        }
      ],
      temperature: defaultConfig.temperature,
      max_tokens: defaultConfig.maxTokens
    };

    const response = await this.query(request);
    return this.parsePricingAnalysis(response.choices[0]?.message?.content || '');
  }

  // Curriculum Gap Analysis
  async analyzeCurriculumRelevance(curriculumData: any): Promise<{
    industryAlignment: number;
    skillGaps: string[];
    modernizationNeeds: string[];
    marketTrends: string[];
    recommendations: string[];
  }> {
    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are a curriculum design expert with deep knowledge of industry trends and educational standards. Analyze curricula for industry relevance and modernization opportunities.'
        },
        {
          role: 'user',
          content: `Analyze this curriculum for industry alignment and modernization:

Course: ${curriculumData.courseName}
Current Subjects: ${JSON.stringify(curriculumData.subjects)}
Practical vs Theory Ratio: ${curriculumData.practicalRatio}%
Industry Partnerships: ${curriculumData.partnerships || 'None'}
Graduate Employment Rate: ${curriculumData.employmentRate}%
Average Graduate Salary: ₹${curriculumData.avgSalary}
Last Updated: ${curriculumData.lastUpdate}

Provide analysis on:
1. Industry alignment score (0-100)
2. Critical skill gaps compared to current job market
3. Urgent modernization needs
4. Emerging technology trends to integrate
5. Specific actionable recommendations

Base analysis on latest industry reports and job market data.`
        }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      search_recency_filter: 'week'
    };

    const response = await this.query(request);
    return this.parseCurriculumAnalysis(response.choices[0]?.message?.content || '');
  }

  // Staff Optimization Intelligence
  async analyzeStaffOptimization(staffData: any[], workloadData: any): Promise<{
    efficiencyScore: number;
    burnoutRisks: string[];
    hiringRecommendations: string[];
    workloadDistribution: any;
    performanceInsights: string[];
  }> {
    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are an HR analytics expert specializing in educational institution workforce optimization. Analyze staff performance and provide actionable insights for productivity enhancement.'
        },
        {
          role: 'user',
          content: `Analyze staff optimization for educational institution:

Total Staff: ${staffData.length}
Average Workload Hours: ${workloadData.avgHours}/week
Staff-Student Ratio: 1:${workloadData.studentRatio}
Overtime Rate: ${workloadData.overtimeRate}%
Staff Satisfaction: ${workloadData.satisfactionScore}/100
Turnover Rate: ${workloadData.turnoverRate}%
Training Hours/Year: ${workloadData.trainingHours}

Department Breakdown:
${staffData.map(dept => `${dept.department}: ${dept.count} staff, ${dept.avgHours}h/week`).join('\n')}

Provide analysis on:
1. Overall efficiency score (0-100)
2. Staff burnout risk factors
3. Strategic hiring recommendations
4. Optimal workload distribution
5. Performance improvement insights

Reference best practices in educational workforce management.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1300
    };

    const response = await this.query(request);
    return this.parseStaffAnalysis(response.choices[0]?.message?.content || '');
  }

  // Virtual Counselor Intelligence
  async processIntelligentQuery(userQuery: string, context: any): Promise<{
    response: string;
    intent: string;
    sentiment: string;
    suggestedActions: string[];
    escalationNeeded: boolean;
    confidence: number;
  }> {
    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are an intelligent educational counselor assistant. Provide helpful, accurate responses to student and parent inquiries while identifying intent, sentiment, and escalation needs.'
        },
        {
          role: 'user',
          content: `Process this educational inquiry:

User Query: "${userQuery}"
User Type: ${context.userType || 'unknown'}
Previous Interactions: ${context.messageCount || 0}
Current Topic: ${context.currentTopic || 'general'}

Provide:
1. Helpful, accurate response
2. Query intent classification
3. Sentiment analysis
4. Suggested follow-up actions
5. Whether human escalation is needed
6. Confidence in response accuracy (0-100)

Ensure responses are educational, supportive, and actionable.`
        }
      ],
      temperature: 0.4,
      max_tokens: 800
    };

    const response = await this.query(request);
    return this.parseVirtualCounselorResponse(response.choices[0]?.message?.content || '');
  }

  // Content Generation for Educational Materials
  async generateEducationalContent(contentRequest: any): Promise<{
    content: string;
    learningObjectives: string[];
    assessmentQuestions: any[];
    difficulty: string;
    estimatedTime: number;
  }> {
    const request: PerplexityRequest = {
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator specializing in curriculum development and instructional design. Create engaging, pedagogically sound educational materials.'
        },
        {
          role: 'user',
          content: `Create educational content for:

Subject: ${contentRequest.subject}
Topic: ${contentRequest.topic}
Grade Level: ${contentRequest.gradeLevel}
Duration: ${contentRequest.duration} minutes
Learning Style: ${contentRequest.learningStyle || 'mixed'}
Existing Knowledge: ${contentRequest.prerequisites || 'basic'}

Generate:
1. Comprehensive lesson content with examples
2. Clear learning objectives
3. Assessment questions (multiple choice and short answer)
4. Difficulty level appropriate for grade
5. Estimated completion time

Ensure content follows modern pedagogical principles and engages learners effectively.`
        }
      ],
      temperature: 0.6,
      max_tokens: 2000
    };

    const response = await this.query(request);
    return this.parseContentGeneration(response.choices[0]?.message?.content || '');
  }

  // Parser Methods
  private parseStudentAnalysis(content: string) {
    // Extract structured data from AI response
    const successMatch = content.match(/success probability[:\s]*(\d+)/i);
    const successProbability = successMatch ? parseInt(successMatch[1]) : 65;

    const riskFactors = this.extractListItems(content, 'risk factor');
    const recommendations = this.extractListItems(content, 'recommendation');
    
    const confidenceMatch = content.match(/confidence[:\s]*(\d+)/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75;

    return {
      successProbability,
      riskFactors: riskFactors.slice(0, 3),
      recommendations: recommendations.slice(0, 3),
      confidence
    };
  }

  private parsePricingAnalysis(content: string) {
    const priceMatch = content.match(/₹\s*([0-9,]+)/);
    const recommendedPrice = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 50000;

    const percentMatch = content.match(/(\d+)%.*change/i);
    const priceChangePercentage = percentMatch ? parseInt(percentMatch[1]) : 0;

    return {
      recommendedPrice,
      priceChangePercentage,
      marketJustification: this.extractSection(content, 'market') || 'Market analysis supports this pricing',
      demandLevel: this.extractDemandLevel(content),
      competitorAnalysis: this.extractSection(content, 'competitive') || 'Competitive positioning favorable'
    };
  }

  private parseCurriculumAnalysis(content: string) {
    const alignmentMatch = content.match(/alignment.*?(\d+)/i);
    const industryAlignment = alignmentMatch ? parseInt(alignmentMatch[1]) : 70;

    return {
      industryAlignment,
      skillGaps: this.extractListItems(content, 'gap'),
      modernizationNeeds: this.extractListItems(content, 'moderniz'),
      marketTrends: this.extractListItems(content, 'trend'),
      recommendations: this.extractListItems(content, 'recommendation')
    };
  }

  private parseStaffAnalysis(content: string) {
    const efficiencyMatch = content.match(/efficiency.*?(\d+)/i);
    const efficiencyScore = efficiencyMatch ? parseInt(efficiencyMatch[1]) : 75;

    return {
      efficiencyScore,
      burnoutRisks: this.extractListItems(content, 'burnout'),
      hiringRecommendations: this.extractListItems(content, 'hiring'),
      workloadDistribution: { balanced: true, recommendations: this.extractListItems(content, 'workload') },
      performanceInsights: this.extractListItems(content, 'performance')
    };
  }

  private parseVirtualCounselorResponse(content: string) {
    const intentMatch = content.match(/intent[:\s]*([^\n]+)/i);
    const intent = intentMatch ? intentMatch[1].trim() : 'general_inquiry';

    const sentimentMatch = content.match(/sentiment[:\s]*([^\n]+)/i);
    const sentiment = sentimentMatch ? sentimentMatch[1].trim() : 'neutral';

    const escalationMatch = content.match(/escalation[:\s]*(yes|no|true|false)/i);
    const escalationNeeded = escalationMatch ? 
      ['yes', 'true'].includes(escalationMatch[1].toLowerCase()) : false;

    const confidenceMatch = content.match(/confidence[:\s]*(\d+)/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 80;

    return {
      response: this.extractMainResponse(content),
      intent,
      sentiment,
      suggestedActions: this.extractListItems(content, 'action'),
      escalationNeeded,
      confidence
    };
  }

  private parseContentGeneration(content: string) {
    const timeMatch = content.match(/(\d+)\s*minutes?/i);
    const estimatedTime = timeMatch ? parseInt(timeMatch[1]) : 45;

    const difficultyMatch = content.match(/difficulty[:\s]*([^\n]+)/i);
    const difficulty = difficultyMatch ? difficultyMatch[1].trim() : 'intermediate';

    return {
      content: this.extractMainContent(content),
      learningObjectives: this.extractListItems(content, 'objective'),
      assessmentQuestions: this.extractQuestions(content),
      difficulty,
      estimatedTime
    };
  }

  // Utility parsing methods
  private extractListItems(text: string, keyword: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
        // Look for numbered or bulleted lists after the keyword
        for (let j = i; j < Math.min(i + 10, lines.length); j++) {
          const line = lines[j].trim();
          if (line.match(/^[\d\.\-\*\•]\s/)) {
            items.push(line.replace(/^[\d\.\-\*\•]\s*/, '').trim());
          }
        }
      }
    }
    
    return items.slice(0, 5); // Limit to 5 items
  }

  private extractSection(text: string, keyword: string): string | null {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
        return lines.slice(i, i + 3).join(' ').trim();
      }
    }
    return null;
  }

  private extractDemandLevel(text: string): string {
    if (text.toLowerCase().includes('high demand')) return 'high';
    if (text.toLowerCase().includes('low demand')) return 'low';
    return 'medium';
  }

  private extractMainResponse(text: string): string {
    const lines = text.split('\n');
    const responseLines = lines.slice(0, 5); // First few lines usually contain main response
    return responseLines.join(' ').trim().substring(0, 500);
  }

  private extractMainContent(text: string): string {
    return text.substring(0, 1000); // First 1000 characters as main content
  }

  private extractQuestions(text: string): any[] {
    const questions: any[] = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.includes('?') && line.length > 10) {
        questions.push({
          question: line.trim(),
          type: 'short_answer',
          points: 5
        });
      }
    });
    
    return questions.slice(0, 5);
  }
}

// Export singleton instance
export const perplexityAI = new PerplexityAI();