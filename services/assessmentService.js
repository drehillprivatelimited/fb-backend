import Assessment from '../models/Assessment.js';
import AssessmentSection from '../models/AssessmentSection.js';
import AssessmentSession from '../models/AssessmentSession.js';
import { v4 as uuidv4 } from 'uuid';

// Utility function to generate scale options for likert questions
const generateScaleOptions = (min = 1, max = 7) => {
  const scaleLabels = {
    1: 'Strongly Disagree',
    2: 'Disagree',
    3: 'Somewhat Disagree',
    4: 'Neutral',
    5: 'Somewhat Agree',
    6: 'Agree',
    7: 'Strongly Agree'
  };

  const options = [];
  for (let i = min; i <= max; i++) {
    options.push({
      value: i,
      label: scaleLabels[i] || `Option ${i}`,
      description: scaleLabels[i] || `Scale option ${i}`
    });
  }
  return options;
};

// Function to convert slider questions to likert with proper options
const convertSliderToLikert = (question) => {
  if (question.type === 'slider' && question.scale) {
    return {
      ...question,
      type: 'likert',
      scale: {
        min: question.scale.min || 1,
        max: question.scale.max || 7,
        labels: {
          min: 'Strongly Disagree',
          max: 'Strongly Agree'
        },
        scaleOptions: generateScaleOptions(question.scale.min || 1, question.scale.max || 7)
      }
    };
  }
  return question;
};

class AssessmentService {
  // Get all active assessments
  async getAllAssessments() {
    try {
      const assessments = await Assessment.find({ isActive: true })
        .sort({ category: 1, title: 1 });
      
      return assessments;
    } catch (error) {
      throw new Error(`Error fetching assessments: ${error.message}`);
    }
  }

  // Get assessment by ID with embedded sections
  async getAssessmentById(assessmentId) {
    try {
      const assessment = await Assessment.findOne({ 
        id: assessmentId, 
        isActive: true 
      });
      
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Process questions to add scale options for likert questions
      const processQuestions = (questions) => {
        return questions.map(question => {
          let processedQuestion = { ...question.toObject ? question.toObject() : question };
          
          // Convert slider questions to likert with proper options
          processedQuestion = convertSliderToLikert(processedQuestion);
          
          // Ensure likert questions have proper scale options
          if (processedQuestion.type === 'likert') {
            // Always generate scale options for likert questions
            const min = processedQuestion.scale?.min || 1;
            const max = processedQuestion.scale?.max || 7;
            
            processedQuestion.scale = {
              ...processedQuestion.scale,
              min,
              max,
              labels: {
                min: 'Strongly Disagree',
                max: 'Strongly Agree'
              },
              scaleOptions: generateScaleOptions(min, max)
            };
          }
          
          return processedQuestion;
        });
      };

      // Convert embedded sections to array format for frontend compatibility
      const sections = [];
      if (assessment.sections) {
        if (assessment.sections.psychometric) {
          sections.push({
            id: 'psychometric',
            type: 'psychometric',
            title: assessment.sections.psychometric.title,
            description: assessment.sections.psychometric.description,
            questions: processQuestions(assessment.sections.psychometric.questions),
            weight: assessment.sections.psychometric.weight || 25,
            orderIndex: 1,
            scoringConfig: assessment.sections.psychometric.scoringConfig
          });
        }
        if (assessment.sections.technical) {
          sections.push({
            id: 'technical',
            type: 'technical',
            title: assessment.sections.technical.title,
            description: assessment.sections.technical.description,
            questions: processQuestions(assessment.sections.technical.questions),
            weight: assessment.sections.technical.weight || 30,
            orderIndex: 2,
            scoringConfig: assessment.sections.technical.scoringConfig
          });
        }
        if (assessment.sections.wiscar) {
          sections.push({
            id: 'wiscar',
            type: 'wiscar',
            title: assessment.sections.wiscar.title,
            description: assessment.sections.wiscar.description,
            questions: processQuestions(assessment.sections.wiscar.questions),
            weight: assessment.sections.wiscar.weight || 25,
            orderIndex: 3,
            scoringConfig: assessment.sections.wiscar.scoringConfig
          });
        }
      }

      return {
        ...assessment.toObject(),
        sections
      };
    } catch (error) {
      throw new Error(`Error fetching assessment: ${error.message}`);
    }
  }

  // Get assessments by category
  async getAssessmentsByCategory(category) {
    try {
      const assessments = await Assessment.find({ 
        category, 
        isActive: true 
      }).sort({ title: 1 });
      
      return assessments;
    } catch (error) {
      throw new Error(`Error fetching assessments by category: ${error.message}`);
    }
  }

  // Get featured assessments
  async getFeaturedAssessments() {
    try {
      const assessments = await Assessment.find({ 
        featured: true, 
        isActive: true 
      }).sort({ title: 1 });
      
      return assessments;
    } catch (error) {
      throw new Error(`Error fetching featured assessments: ${error.message}`);
    }
  }

  // Start assessment session
  async startAssessmentSession(assessmentId, userId = null, metadata = {}) {
    try {
      // Verify assessment exists and is active
      const assessment = await Assessment.findOne({ 
        id: assessmentId, 
        isActive: true 
      });
      
      if (!assessment) {
        throw new Error('Assessment not found or inactive');
      }

      // Create new session
      const sessionId = uuidv4();
      const session = new AssessmentSession({
        sessionId,
        assessmentId,
        userId,
        status: 'in-progress',
        metadata: {
          userAgent: metadata.userAgent || '',
          ipAddress: metadata.ipAddress || '',
          referrer: metadata.referrer || '',
          deviceType: metadata.deviceType || 'desktop'
        },
        startedAt: new Date()
      });

      await session.save();
      
      return {
        sessionId,
        assessmentId,
        startedAt: session.startedAt
      };
    } catch (error) {
      throw new Error(`Error starting assessment session: ${error.message}`);
    }
  }

  // Submit assessment answers and calculate results
  async submitAssessment(sessionId, answers) {
    try {
      console.log('Submitting assessment with answers:', JSON.stringify(answers, null, 2));
      
      const session = await AssessmentSession.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.status === 'completed') {
        throw new Error('Assessment already completed');
      }

      // Update session with answers
      session.answers = answers;
      session.status = 'completed';
      session.completedAt = new Date();
      session.duration = Math.round(
        (session.completedAt - session.startedAt) / (1000 * 60)
      );

      // Calculate results
      const results = await this.calculateResults(session.assessmentId, answers);
      session.results = results;

      await session.save();
      
      console.log('Assessment submitted successfully with results:', JSON.stringify(results, null, 2));
      
      return {
        sessionId,
        results,
        duration: session.duration
      };
    } catch (error) {
      console.error('Error in submitAssessment:', error);
      throw new Error(`Error submitting assessment: ${error.message}`);
    }
  }

  // Get assessment results
  async getAssessmentResults(sessionId) {
    try {
      console.log('=== GET ASSESSMENT RESULTS START ===');
      console.log('Session ID:', sessionId);
      
      const session = await AssessmentSession.findOne({ sessionId });
      
      if (!session) {
        console.log('Session not found for ID:', sessionId);
        throw new Error('Session not found');
      }

      console.log('Session found:', {
        sessionId: session.sessionId,
        status: session.status,
        hasResults: !!session.results,
        resultsKeys: session.results ? Object.keys(session.results) : []
      });

      if (session.status !== 'completed') {
        console.log('Session not completed, status:', session.status);
        throw new Error('Assessment not completed');
      }

      const response = {
        sessionId,
        assessmentId: session.assessmentId,
        results: session.results,
        duration: session.duration,
        completedAt: session.completedAt
      };

      console.log('Returning results:', {
        sessionId: response.sessionId,
        assessmentId: response.assessmentId,
        hasResults: !!response.results,
        resultsKeys: response.results ? Object.keys(response.results) : []
      });
      console.log('=== GET ASSESSMENT RESULTS END ===');

      return response;
    } catch (error) {
      console.error('Error in getAssessmentResults:', error);
      throw new Error(`Error fetching results: ${error.message}`);
    }
  }

  // Calculate assessment results
  async calculateResults(assessmentId, answers) {
    try {
      console.log('Calculating results for assessment:', assessmentId);
      console.log('Answers received:', JSON.stringify(answers, null, 2));
      
      // Get assessment with embedded sections
      const assessment = await Assessment.findOne({ id: assessmentId });
      
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      console.log('Assessment found:', assessment.title);

      // Process questions to add scale options for likert questions
      const processQuestions = (questions) => {
        return questions.map(question => {
          let processedQuestion = { ...question.toObject ? question.toObject() : question };
          
          // Convert slider questions to likert with proper options
          processedQuestion = convertSliderToLikert(processedQuestion);
          
          // Ensure likert questions have proper scale options
          if (processedQuestion.type === 'likert') {
            // Always generate scale options for likert questions
            const min = processedQuestion.scale?.min || 1;
            const max = processedQuestion.scale?.max || 7;
            
            processedQuestion.scale = {
              ...processedQuestion.scale,
              min,
              max,
              labels: {
                min: 'Strongly Disagree',
                max: 'Strongly Agree'
              },
              scaleOptions: generateScaleOptions(min, max)
            };
          }
          
          return processedQuestion;
        });
      };

      // Convert embedded sections to array format
      const sections = [];
      if (assessment.sections) {
        if (assessment.sections.psychometric) {
          sections.push({
            id: 'psychometric',
            type: 'psychometric',
            title: assessment.sections.psychometric.title,
            description: assessment.sections.psychometric.description,
            questions: processQuestions(assessment.sections.psychometric.questions),
            weight: assessment.sections.psychometric.weight || 25,
            orderIndex: 1
          });
        }
        if (assessment.sections.technical) {
          sections.push({
            id: 'technical',
            type: 'technical',
            title: assessment.sections.technical.title,
            description: assessment.sections.technical.description,
            questions: processQuestions(assessment.sections.technical.questions),
            weight: assessment.sections.technical.weight || 30,
            orderIndex: 2
          });
        }
        if (assessment.sections.wiscar) {
          sections.push({
            id: 'wiscar',
            type: 'wiscar',
            title: assessment.sections.wiscar.title,
            description: assessment.sections.wiscar.description,
            questions: processQuestions(assessment.sections.wiscar.questions),
            weight: assessment.sections.wiscar.weight || 25,
            orderIndex: 3
          });
        }
      }

      console.log('Sections found:', sections.map(s => ({ id: s.id, type: s.type, questionCount: s.questions?.length || 0 })));

      // Calculate section scores
      const sectionScores = [];
      const psychometricScores = {
        overall: 0,
        categories: {
          interest: 0,
          motivation: 0,
          personality: 0,
          cognitive: 0,
          growth: 75 // Default growth mindset score
        }
      };
      
      const technicalScores = {
        overall: 0,
        categories: {
          logicalReasoning: 0,
          numeracy: 0,
          domainKnowledge: 0,
          problemSolving: 0
        },
        correctAnswers: 0,
        totalQuestions: 0
      };
      
      const wiscarScores = {
        overall: 0,
        dimensions: {
          will: 0,
          interest: 0,
          skill: 0,
          cognitive: 0,
          ability: 0,
          realWorld: 0
        }
      };

      // Calculate section scores
      for (const section of sections) {
        if (section.type === 'introduction') continue;

        const sectionAnswers = answers.filter(answer => 
          section.questions.some(q => q.id === answer.questionId)
        );

        console.log(`Section ${section.type}: Found ${sectionAnswers.length} answers out of ${section.questions?.length || 0} questions`);

        const score = this.calculateSectionScore(section, sectionAnswers);
        sectionScores.push({
          sectionId: section.id,
          score: score.score,
          maxScore: score.maxScore,
          percentage: score.percentage,
          performance: score.performance
        });

        console.log(`Section ${section.type} score:`, score);

        // Calculate detailed scores for each section type
        if (section.type === 'psychometric') {
          const psychometric = this.calculatePsychometricScores(section, sectionAnswers);
          Object.assign(psychometricScores, psychometric);
          console.log('Psychometric scores:', psychometric);
        } else if (section.type === 'technical') {
          const technical = this.calculateTechnicalScores(section, sectionAnswers);
          Object.assign(technicalScores, technical);
          console.log('Technical scores:', technical);
        } else if (section.type === 'wiscar') {
          const wiscar = this.calculateWISCARScores(section, sectionAnswers);
          Object.assign(wiscarScores, wiscar);
          console.log('WISCAR scores:', wiscar);
        }
      }

      // Calculate overall score
      const overallScore = Math.round(
        ((psychometricScores.overall || 0) + (technicalScores.overall || 0) + (wiscarScores.overall || 0)) / 3
      );
      
      // Generate recommendation
      let recommendation = 'MAYBE';
      let recommendationReason = '';
      
      if (overallScore >= 75) {
        recommendation = 'YES';
        recommendationReason = 'You show excellent alignment across all assessment dimensions, indicating strong potential for success in this field.';
      } else if (overallScore >= 60) {
        recommendation = 'MAYBE';
        recommendationReason = 'You have good potential but may need to strengthen certain areas before pursuing this career path.';
      } else {
        recommendation = 'NO';
        recommendationReason = 'Based on your current profile, other career paths might be a better fit for your interests and skills.';
      }

      // Generate skill gaps
      const skillGaps = [
        { 
          skill: 'Technical Fundamentals', 
          currentLevel: technicalScores.overall || 0, 
          requiredLevel: 70, 
          priority: 'high' 
        },
        { 
          skill: 'Problem Solving', 
          currentLevel: technicalScores.categories.logicalReasoning || 0, 
          requiredLevel: 75, 
          priority: 'medium' 
        },
        { 
          skill: 'Domain Knowledge', 
          currentLevel: technicalScores.categories.domainKnowledge || 0, 
          requiredLevel: 60, 
          priority: 'high' 
        }
      ];

      // Generate career matches
      const careerMatches = [
        {
          title: 'Platform Developer',
          description: 'Build custom applications and workflows',
          matchScore: Math.max(technicalScores.overall || 0, 70),
          salary: '$85,000 - $120,000',
          demand: 'high',
          requirements: ['Programming', 'System Design', 'Problem Solving']
        },
        {
          title: 'Platform Administrator',
          description: 'Manage platform configuration and users',
          matchScore: Math.max(technicalScores.categories.domainKnowledge || 0, 75),
          salary: '$70,000 - $95,000',
          demand: 'high',
          requirements: ['System Administration', 'User Management', 'Process Design']
        },
        {
          title: 'Business Analyst',
          description: 'Bridge business needs with technical solutions',
          matchScore: Math.max(psychometricScores.categories.cognitive || 0, 65),
          salary: '$65,000 - $90,000',
          demand: 'medium',
          requirements: ['Requirements Analysis', 'Communication', 'Process Mapping']
        }
      ];

      // Generate learning path
      const learningPath = [
        {
          stage: 'Foundation',
          duration: '2-4 weeks',
          modules: ['Platform Basics', 'Navigation', 'Core Concepts'],
          effort: 'low',
          completed: false
        },
        {
          stage: 'Intermediate',
          duration: '6-8 weeks',
          modules: ['Scripting Basics', 'Workflow Design', 'Configuration'],
          effort: 'medium',
          completed: false
        },
        {
          stage: 'Advanced',
          duration: '8-12 weeks',
          modules: ['Custom Development', 'Integration', 'Performance'],
          effort: 'high',
          completed: false
        },
        {
          stage: 'Certification',
          duration: '4-6 weeks',
          modules: ['Exam Prep', 'Practice Projects', 'Portfolio'],
          effort: 'medium',
          completed: false
        }
      ];

      // Generate improvement areas
      const improvementAreas = [
        {
          area: 'Technical Skills',
          currentScore: technicalScores.overall || 0,
          targetScore: 80,
          tips: ['Practice coding exercises daily', 'Take online courses', 'Build small projects'],
          resources: ['FreeCodeCamp', 'Codecademy', 'YouTube tutorials']
        },
        {
          area: 'Domain Knowledge',
          currentScore: technicalScores.categories.domainKnowledge || 0,
          targetScore: 75,
          tips: ['Read industry blogs', 'Join professional communities', 'Attend webinars'],
          resources: ['Official documentation', 'Community forums', 'Industry conferences']
        }
      ];

      // Universal results format
      const finalResults = {
        assessmentTitle: assessment.title,
        overallScore,
        confidenceScore: Math.min(95, Math.max(70, overallScore + Math.random() * 10)),
        recommendation,
        recommendationReason,
        psychometric: psychometricScores,
        technical: technicalScores,
        wiscar: wiscarScores,
        skillGaps,
        careerMatches,
        learningPath,
        improvementAreas,
        metadata: {
          timestamp: new Date().toISOString(),
          assessmentId: assessment.id
        }
      };

      console.log('=== FINAL RESULTS STRUCTURE ===');
      console.log('Final results keys:', Object.keys(finalResults));
      console.log('Psychometric scores:', finalResults.psychometric);
      console.log('Technical scores:', finalResults.technical);
      console.log('WISCAR scores:', finalResults.wiscar);
      console.log('Overall score:', finalResults.overallScore);
      console.log('Recommendation:', finalResults.recommendation);
      console.log('=== FINAL RESULTS END ===');

      console.log('Final results:', JSON.stringify(finalResults, null, 2));

      return finalResults;
    } catch (error) {
      throw new Error(`Error calculating results: ${error.message}`);
    }
  }

  // Calculate section score
  calculateSectionScore(section, answers) {
    if (answers.length === 0) {
      return {
        score: 0,
        maxScore: 100,
        percentage: 0,
        performance: 'needsImprovement'
      };
    }

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const answer of answers) {
      const question = section.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    let performance = 'needsImprovement';
    if (section.scoringConfig && section.scoringConfig.thresholds) {
      if (percentage >= section.scoringConfig.thresholds.excellent) {
        performance = 'excellent';
      } else if (percentage >= section.scoringConfig.thresholds.good) {
        performance = 'good';
      }
    } else {
      // Default thresholds if scoringConfig is not available
      if (percentage >= 80) {
        performance = 'excellent';
      } else if (percentage >= 60) {
        performance = 'good';
      }
    }

    return {
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: Math.round(percentage),
      performance
    };
  }

  // Calculate question score
  calculateQuestionScore(question, answerValue) {
    console.log(`Calculating score for question ${question.id}:`, { type: question.type, answerValue, question });
    
    switch (question.type) {
      case 'multiple-choice':
        const option = question.options.find(opt => opt.value === answerValue);
        const score = option ? (option.score || option.value || 0) : 0;
        const maxScore = Math.max(...question.options.map(opt => opt.score || opt.value || 0));
        console.log(`Multiple choice score: ${score}/${maxScore}`);
        return {
          score: score,
          maxScore: maxScore
        };
      
      case 'likert':
        // For likert questions, the answerValue should be the scale value (1-7)
        if (question.scale && question.scale.min !== undefined && question.scale.max !== undefined) {
          // Normalize the answer to 0-100 scale
          const normalizedValue = ((answerValue - question.scale.min) / (question.scale.max - question.scale.min)) * 100;
          console.log(`Likert score: ${answerValue} -> ${normalizedValue}% (scale: ${question.scale.min}-${question.scale.max})`);
          return {
            score: normalizedValue,
            maxScore: 100
          };
        }
        // Fallback for likert without scale
        console.log(`Likert fallback score: ${answerValue} -> ${answerValue * 20}%`);
        return {
          score: answerValue * 20, // Assume 1-5 scale, convert to percentage
          maxScore: 100
        };
      
      case 'slider':
        if (question.scale && question.scale.min !== undefined && question.scale.max !== undefined) {
          const normalizedValue = ((answerValue - question.scale.min) / (question.scale.max - question.scale.min)) * 100;
          console.log(`Slider score: ${answerValue} -> ${normalizedValue}% (scale: ${question.scale.min}-${question.scale.max})`);
          return {
            score: normalizedValue,
            maxScore: 100
          };
        }
        console.log(`Slider fallback score: ${answerValue} -> ${answerValue}%`);
        return {
          score: answerValue,
          maxScore: 100
        };
      
      case 'boolean':
        const boolScore = answerValue ? 100 : 0;
        console.log(`Boolean score: ${answerValue} -> ${boolScore}%`);
        return {
          score: boolScore,
          maxScore: 100
        };
      
      case 'text':
        // For text questions, give a default score based on whether there's content
        const textScore = answerValue && answerValue.trim().length > 0 ? 75 : 0;
        console.log(`Text score: ${answerValue ? 'has content' : 'empty'} -> ${textScore}%`);
        return {
          score: textScore,
          maxScore: 100
        };
      
      default:
        console.log(`Default score: ${answerValue} -> 0%`);
        return {
          score: 0,
          maxScore: 100
        };
    }
  }

  // Calculate WISCAR overall score
  calculateWISCARScores(section, answers) {
    console.log('=== WISCAR CALCULATION START ===');
    console.log('Section questions:', section.questions?.length || 0);
    console.log('Section answers:', answers?.length || 0);
    
    if (answers.length === 0) {
      console.log('No answers provided for WISCAR section');
      return { 
        overall: 0,
        dimensions: {
          will: 0,
          interest: 0,
          skill: 0,
          cognitive: 0,
          ability: 0,
          realWorld: 0
        }
      };
    }

    // Calculate overall WISCAR score from all questions
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const answer of answers) {
      const question = section.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

            const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }

    const overall = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    // Calculate individual WISCAR dimensions
    const dimensions = {
      will: this.calculateWISCARDimension(section, answers, 'will'),
      interest: this.calculateWISCARDimension(section, answers, 'interest'),
      skill: this.calculateWISCARDimension(section, answers, 'skill'),
      cognitive: this.calculateWISCARDimension(section, answers, 'cognitive'),
      ability: this.calculateWISCARDimension(section, answers, 'ability'),
      realWorld: this.calculateWISCARDimension(section, answers, 'realWorld')
    };
    
    console.log('Overall WISCAR score:', overall);
    console.log('WISCAR dimensions:', dimensions);
    console.log('=== WISCAR CALCULATION END ===');

    return { 
      overall,
      dimensions
    };
  }

  // Calculate WISCAR dimension score
  calculateWISCARDimension(section, answers, dimension) {
    const dimensionQuestions = section.questions.filter(q => 
      q.category === dimension || q.id.includes(dimension)
    );
    
    if (dimensionQuestions.length === 0) return 0;
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const question of dimensionQuestions) {
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer) continue;
      
      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }
    
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  // Calculate psychometric scores
  calculatePsychometricScores(section, answers) {
    console.log('=== PSYCHOMETRIC CALCULATION START ===');
    
    if (answers.length === 0) {
      return {
        overall: 0,
        categories: {
          interest: 0,
          motivation: 0,
          personality: 0,
          cognitive: 0,
          growth: 75
        }
      };
    }

    // Calculate overall psychometric score
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const answer of answers) {
      const question = section.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }

    const overall = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    // Calculate category scores
    const categories = {
      interest: this.calculatePsychometricCategory(section, answers, 'interest'),
      motivation: this.calculatePsychometricCategory(section, answers, 'motivation'),
      personality: this.calculatePsychometricCategory(section, answers, 'personality'),
      cognitive: this.calculatePsychometricCategory(section, answers, 'cognitive'),
      growth: 75 // Default growth mindset score
    };
    
    console.log('Overall psychometric score:', overall);
    console.log('Psychometric categories:', categories);
    console.log('=== PSYCHOMETRIC CALCULATION END ===');

    return {
      overall,
      categories
    };
  }

  // Calculate psychometric category score
  calculatePsychometricCategory(section, answers, category) {
    const categoryQuestions = section.questions.filter(q => 
      q.category === category || q.id.includes(category)
    );
    
    if (categoryQuestions.length === 0) return 0;
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const question of categoryQuestions) {
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer) continue;
      
      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }
    
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  // Calculate technical scores
  calculateTechnicalScores(section, answers) {
    console.log('=== TECHNICAL CALCULATION START ===');
    
    if (answers.length === 0) {
      return {
        overall: 0,
        categories: {
          logicalReasoning: 0,
          numeracy: 0,
          domainKnowledge: 0,
          problemSolving: 0
        },
        correctAnswers: 0,
        totalQuestions: section.questions.length
      };
    }

    // Calculate overall technical score
    let totalScore = 0;
    let maxPossibleScore = 0;
    let correctAnswers = 0;

    for (const answer of answers) {
      const question = section.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
      
      // Count correct answers for multiple choice questions
      if (question.type === 'multipleChoice' && score.score > 0) {
        correctAnswers++;
      }
    }

    const overall = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    // Calculate category scores
    const categories = {
      logicalReasoning: this.calculateTechnicalCategory(section, answers, 'logical'),
      numeracy: this.calculateTechnicalCategory(section, answers, 'numerical'),
      domainKnowledge: this.calculateTechnicalCategory(section, answers, 'domain'),
      problemSolving: this.calculateTechnicalCategory(section, answers, 'problem')
    };
    
    console.log('Overall technical score:', overall);
    console.log('Technical categories:', categories);
    console.log('Correct answers:', correctAnswers, 'out of', section.questions.length);
    console.log('=== TECHNICAL CALCULATION END ===');

    return {
      overall,
      categories,
      correctAnswers,
      totalQuestions: section.questions.length
    };
  }

  // Calculate technical category score
  calculateTechnicalCategory(section, answers, category) {
    const categoryQuestions = section.questions.filter(q => 
      q.category === category || q.id.includes(category)
    );
    
    if (categoryQuestions.length === 0) return 0;
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const question of categoryQuestions) {
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer) continue;
      
      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }
    
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  // Calculate overall score
  calculateOverallScore(sectionScores, wiscarScores) {
    const totalSections = sectionScores.length;
    const wiscarOverall = wiscarScores.overall || 0;

    const sectionAverage = totalSections > 0 
      ? sectionScores.reduce((sum, section) => sum + section.percentage, 0) / totalSections 
      : 0;

    return Math.round((sectionAverage + wiscarOverall) / 2);
  }

  // Generate recommendation
  generateRecommendation(overallScore) {
    if (overallScore >= 75) return 'yes';
    if (overallScore >= 50) return 'maybe';
    return 'no';
  }

  // Get recommendation reason
  getRecommendationReason(recommendation, score) {
    switch (recommendation) {
      case 'yes':
        return 'You show excellent alignment with this career path. Your skills, interests, and personality traits make you a strong candidate.';
      case 'maybe':
        return 'You have good potential for this career path with some development. Consider strengthening specific areas to improve your fit.';
      case 'no':
        return 'This career path may not be the best fit for your current profile. Consider exploring alternative paths that align better with your strengths.';
      default:
        return 'Assessment completed. Review your detailed results below.';
    }
  }

  // Generate career paths
  generateCareerPaths(overallScore, sectionScores) {
    // This would be customized based on the specific assessment
    const careerPaths = [
      {
        title: 'Primary Career Path',
        description: 'Based on your assessment results',
        alignmentScore: overallScore,
        matchLevel: overallScore >= 75 ? 'excellent' : overallScore >= 50 ? 'good' : 'moderate',
        requirements: ['Skill development', 'Experience building', 'Continuous learning'],
        recommendations: ['Start with foundational courses', 'Build practical projects', 'Network with professionals']
      }
    ];

    return careerPaths;
  }

  // Generate recommendations
  generateRecommendations(overallScore, sectionScores) {
    const recommendations = [];

    // Overall recommendation
    recommendations.push({
      type: 'overall',
      title: 'Overall Assessment',
      description: this.getRecommendationReason(this.generateRecommendation(overallScore), overallScore),
      confidence: overallScore,
      nextSteps: this.getNextSteps(this.generateRecommendation(overallScore), overallScore)
    });

    // Section-specific recommendations
    sectionScores.forEach(section => {
      if (section.performance === 'needsImprovement') {
        recommendations.push({
          type: 'section',
          title: `${section.sectionId} Improvement`,
          description: `Focus on improving your ${section.sectionId} skills`,
          confidence: section.percentage,
          nextSteps: [`Practice ${section.sectionId} exercises`, 'Take relevant courses', 'Seek mentorship']
        });
      }
    });

    return recommendations;
  }

  // Get strengths
  getStrengths(sectionScores) {
    return sectionScores
      .filter(section => section.performance === 'excellent')
      .map(section => `Strong ${section.sectionId} skills`);
  }

  // Get improvements
  getImprovements(sectionScores) {
    return sectionScores
      .filter(section => section.performance === 'needsImprovement')
      .map(section => `Develop ${section.sectionId} skills`);
  }

  // Get next steps
  getNextSteps(recommendation, score) {
    switch (recommendation) {
      case 'yes':
        return [
          'Start with foundational courses',
          'Build practical projects',
          'Network with professionals',
          'Consider certification programs'
        ];
      case 'maybe':
        return [
          'Focus on skill development',
          'Take relevant courses',
          'Gain practical experience',
          'Seek mentorship'
        ];
      case 'no':
        return [
          'Explore alternative career paths',
          'Identify transferable skills',
          'Consider related fields',
          'Focus on your strengths'
        ];
      default:
        return ['Review your detailed results', 'Consider your options', 'Plan your next steps'];
    }
  }


}

export default new AssessmentService();
