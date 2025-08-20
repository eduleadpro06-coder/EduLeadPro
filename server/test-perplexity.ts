// Quick test script to verify Perplexity AI integration
import 'dotenv/config';
import { PerplexityAI } from './perplexity-ai';

async function testPerplexityIntegration() {
  console.log('🧪 Testing Perplexity AI Integration...');
  
  const perplexity = new PerplexityAI();
  
  try {
    // Test with sample student data
    const sampleStudentData = {
      name: 'Test Student',
      academicAverage: 75,
      attendanceRate: 85,
      engagementScore: 70,
      paymentStatus: 'Current',
      familyIncome: 'Middle',
      extracurriculars: 'Sports, Music',
      previousIssues: 'None'
    };
    
    console.log('📊 Testing Student Success Prediction...');
    const studentAnalysis = await perplexity.analyzeStudentSuccessPrediction(sampleStudentData);
    console.log('✅ Student Analysis Result:', {
      successProbability: studentAnalysis.successProbability,
      riskFactorsCount: studentAnalysis.riskFactors.length,
      recommendationsCount: studentAnalysis.recommendations.length,
      confidence: studentAnalysis.confidence
    });
    
    // Test with sample course data
    const sampleCourseData = {
      name: 'Web Development Bootcamp',
      currentPrice: 50000,
      duration: '6 months',
      level: 'Intermediate',
      department: 'Computer Science',
      currentEnrollment: 25,
      capacity: 30
    };
    
    const sampleMarketData = {
      conversionRate: 15,
      competitors: 5,
      demandScore: 80,
      economicCondition: 'Stable'
    };
    
    console.log('💰 Testing Pricing Recommendations...');
    const pricingAnalysis = await perplexity.generatePricingRecommendations(sampleCourseData, sampleMarketData);
    console.log('✅ Pricing Analysis Result:', {
      recommendedPrice: pricingAnalysis.recommendedPrice,
      priceChangePercentage: pricingAnalysis.priceChangePercentage,
      demandLevel: pricingAnalysis.demandLevel
    });
    
    console.log('🎉 All tests passed! Perplexity AI integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPerplexityIntegration();