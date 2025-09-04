import Assessment from '../models/Assessment.js';

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









  // Calculate assessment results
  async calculateResults(assessmentId, answers) {
    try {
      // Get assessment with embedded sections
      const assessment = await Assessment.findOne({ id: assessmentId });
      
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

        const score = this.calculateSectionScore(section, sectionAnswers);
        sectionScores.push({
          sectionId: section.id,
          score: score.score,
          maxScore: score.maxScore,
          percentage: score.percentage,
          performance: score.performance
        });

        // Calculate detailed scores for each section type
        if (section.type === 'psychometric') {
          const psychometric = this.calculatePsychometricScores(section, sectionAnswers);
          Object.assign(psychometricScores, psychometric);
        } else if (section.type === 'technical') {
          const technical = this.calculateTechnicalScores(section, sectionAnswers);
          Object.assign(technicalScores, technical);
        } else if (section.type === 'wiscar') {
          const wiscar = this.calculateWISCARScores(section, sectionAnswers);
          Object.assign(wiscarScores, wiscar);
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

      // Generate skill gaps based on actual scores
      const skillGaps = [];
      
      // Technical skill gaps based on actual technical scores
      if (technicalScores.overall < 70) {
        skillGaps.push({
          skill: 'Technical Fundamentals',
          currentLevel: technicalScores.overall,
          requiredLevel: 70,
          priority: 'high'
        });
      }
      
      if (technicalScores.categories.logicalReasoning < 75) {
        skillGaps.push({
          skill: 'Problem Solving',
          currentLevel: technicalScores.categories.logicalReasoning,
          requiredLevel: 75,
          priority: 'medium'
        });
      }
      
      if (technicalScores.categories.domainKnowledge < 60) {
        skillGaps.push({
          skill: 'Domain Knowledge',
          currentLevel: technicalScores.categories.domainKnowledge,
          requiredLevel: 60,
          priority: 'high'
        });
      }
      
      if (technicalScores.categories.numeracy < 65) {
        skillGaps.push({
          skill: 'Numerical Skills',
          currentLevel: technicalScores.categories.numeracy,
          requiredLevel: 65,
          priority: 'medium'
        });
      }
      
      // Psychometric skill gaps
      if (psychometricScores.categories.cognitive < 70) {
        skillGaps.push({
          skill: 'Cognitive Abilities',
          currentLevel: psychometricScores.categories.cognitive,
          requiredLevel: 70,
          priority: 'high'
        });
      }
      
      if (psychometricScores.categories.motivation < 65) {
        skillGaps.push({
          skill: 'Motivation & Drive',
          currentLevel: psychometricScores.categories.motivation,
          requiredLevel: 65,
          priority: 'medium'
        });
      }

      // Generate career matches based on actual scores
      const careerMatches = [];
      
      // Platform Developer - based on technical scores
      const developerScore = Math.max(technicalScores.overall, 70);
      if (developerScore >= 60) {
        careerMatches.push({
          title: 'Platform Developer',
          description: 'Build custom applications and workflows',
          matchScore: developerScore,
          salary: '$85,000 - $120,000',
          demand: developerScore >= 80 ? 'high' : 'medium',
          requirements: ['Programming', 'System Design', 'Problem Solving']
        });
      }
      
      // Platform Administrator - based on domain knowledge
      const adminScore = Math.max(technicalScores.categories.domainKnowledge, 75);
      if (adminScore >= 60) {
        careerMatches.push({
          title: 'Platform Administrator',
          description: 'Manage platform configuration and users',
          matchScore: adminScore,
          salary: '$70,000 - $95,000',
          demand: adminScore >= 80 ? 'high' : 'medium',
          requirements: ['System Administration', 'User Management', 'Process Design']
        });
      }
      
      // Business Analyst - based on cognitive and communication skills
      const analystScore = Math.max(psychometricScores.categories.cognitive, 65);
      if (analystScore >= 60) {
        careerMatches.push({
          title: 'Business Analyst',
          description: 'Bridge business needs with technical solutions',
          matchScore: analystScore,
          salary: '$65,000 - $90,000',
          demand: analystScore >= 75 ? 'high' : 'medium',
          requirements: ['Requirements Analysis', 'Communication', 'Process Mapping']
        });
      }
      
      // Technical Consultant - based on overall technical and psychometric scores
      const consultantScore = Math.round((technicalScores.overall + psychometricScores.overall) / 2);
      if (consultantScore >= 65) {
        careerMatches.push({
          title: 'Technical Consultant',
          description: 'Provide expert technical guidance and solutions',
          matchScore: consultantScore,
          salary: '$90,000 - $130,000',
          demand: consultantScore >= 80 ? 'high' : 'medium',
          requirements: ['Technical Expertise', 'Communication', 'Problem Solving']
        });
      }

      // Generate learning path based on actual skill gaps
      const learningPath = [];
      
      // Foundation stage - always included
      learningPath.push({
        stage: 'Foundation',
        duration: '2-4 weeks',
        modules: ['Platform Basics', 'Navigation', 'Core Concepts'],
        effort: 'low',
        completed: false
      });
      
      // Intermediate stage - if technical score is moderate
      if (technicalScores.overall >= 40) {
        learningPath.push({
          stage: 'Intermediate',
          duration: '6-8 weeks',
          modules: ['Scripting Basics', 'Workflow Design', 'Configuration'],
          effort: 'medium',
          completed: false
        });
      }
      
      // Advanced stage - if technical score is good
      if (technicalScores.overall >= 60) {
        learningPath.push({
          stage: 'Advanced',
          duration: '8-12 weeks',
          modules: ['Custom Development', 'Integration', 'Performance'],
          effort: 'high',
          completed: false
        });
      }
      
      // Certification stage - if overall score is good
      if (overallScore >= 65) {
        learningPath.push({
          stage: 'Certification',
          duration: '4-6 weeks',
          modules: ['Exam Prep', 'Practice Projects', 'Portfolio'],
          effort: 'medium',
          completed: false
        });
      }

      // Generate improvement areas based on actual low scores
      const improvementAreas = [];
      
      // Technical skills improvement
      if (technicalScores.overall < 80) {
        improvementAreas.push({
          area: 'Technical Skills',
          currentScore: technicalScores.overall,
          targetScore: 80,
          tips: [
            'Practice coding exercises daily',
            'Take online courses in relevant technologies',
            'Build small projects to apply knowledge',
            'Join technical communities and forums'
          ],
          resources: ['FreeCodeCamp', 'Codecademy', 'YouTube tutorials', 'GitHub projects']
        });
      }
      
      // Domain knowledge improvement
      if (technicalScores.categories.domainKnowledge < 75) {
        improvementAreas.push({
          area: 'Domain Knowledge',
          currentScore: technicalScores.categories.domainKnowledge,
          targetScore: 75,
          tips: [
            'Read industry blogs and documentation',
            'Join professional communities',
            'Attend webinars and conferences',
            'Follow thought leaders in the field'
          ],
          resources: ['Official documentation', 'Community forums', 'Industry conferences', 'Professional blogs']
        });
      }
      
      // Problem solving improvement
      if (technicalScores.categories.logicalReasoning < 75) {
        improvementAreas.push({
          area: 'Problem Solving',
          currentScore: technicalScores.categories.logicalReasoning,
          targetScore: 75,
          tips: [
            'Practice algorithmic problems',
            'Work on logic puzzles and brain teasers',
            'Break down complex problems into smaller parts',
            'Learn different problem-solving frameworks'
          ],
          resources: ['LeetCode', 'HackerRank', 'Logic puzzles', 'Problem-solving books']
        });
      }
      
      // Cognitive abilities improvement
      if (psychometricScores.categories.cognitive < 70) {
        improvementAreas.push({
          area: 'Cognitive Abilities',
          currentScore: psychometricScores.categories.cognitive,
          targetScore: 70,
          tips: [
            'Practice analytical thinking exercises',
            'Read complex technical materials',
            'Engage in strategic games and puzzles',
            'Take courses in critical thinking'
          ],
          resources: ['Analytical thinking courses', 'Strategic games', 'Critical thinking books', 'Logic courses']
        });
      }

      // Universal results format
      const finalResults = {
        assessmentTitle: assessment.title,
        overallScore,
        confidenceScore: this.calculateConfidenceScore(psychometricScores, technicalScores, wiscarScores),
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
    switch (question.type) {
      case 'multiple-choice':
      case 'multipleChoice':
        const option = question.options.find(opt => opt.value === answerValue);
        const score = option ? (option.score || option.value || 0) : 0;
        const maxScore = Math.max(...question.options.map(opt => opt.score || opt.value || 0));
        return {
          score: score,
          maxScore: maxScore
        };
      
      case 'likert':
        // For likert questions, the answerValue should be the scale value (1-7)
        if (question.scale && question.scale.min !== undefined && question.scale.max !== undefined) {
          // Normalize the answer to 0-100 scale
          const normalizedValue = ((answerValue - question.scale.min) / (question.scale.max - question.scale.min)) * 100;
          return {
            score: normalizedValue,
            maxScore: 100
          };
        }
        // Fallback for likert without scale
        return {
          score: answerValue * 20, // Assume 1-5 scale, convert to percentage
          maxScore: 100
        };
      
      case 'slider':
        if (question.scale && question.scale.min !== undefined && question.scale.max !== undefined) {
          const normalizedValue = ((answerValue - question.scale.min) / (question.scale.max - question.scale.min)) * 100;
          return {
            score: normalizedValue,
            maxScore: 100
          };
        }
        return {
          score: answerValue,
          maxScore: 100
        };
      
      case 'boolean':
        const boolScore = answerValue ? 100 : 0;
        return {
          score: boolScore,
          maxScore: 100
        };
      
      case 'text':
        // For text questions, give a default score based on whether there's content
        const textScore = answerValue && answerValue.trim().length > 0 ? 75 : 0;
        return {
          score: textScore,
          maxScore: 100
        };
      
      default:
        return {
          score: 0,
          maxScore: 100
        };
    }
  }

  // Calculate WISCAR overall score
  calculateWISCARScores(section, answers) {
    if (answers.length === 0) {
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
    


    return { 
      overall,
      dimensions
    };
  }

  // Calculate WISCAR dimension score
  calculateWISCARDimension(section, answers, dimension) {
    // Map expected dimensions to actual question categories
    const dimensionMapping = {
      'will': ['will', 'motivation', 'perseverance', 'drive'],
      'interest': ['interest', 'curiosity', 'engagement'],
      'skill': ['skill', 'ability', 'competence', 'proficiency'],
      'cognitive': ['cognitive', 'thinking', 'mental', 'intellectual'],
      'ability': ['ability', 'capability', 'potential', 'aptitude'],
      'realWorld': ['real-world', 'practical', 'application', 'alignment']
    };
    
    const targetCategories = dimensionMapping[dimension] || [dimension];
    
    const dimensionQuestions = section.questions.filter(q => 
      targetCategories.some(target => 
        q.category === target || 
        q.subcategory === target || 
        q.id.includes(target)
      )
    );
    
    if (dimensionQuestions.length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const question of dimensionQuestions) {
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer) {
        continue;
      }
      
      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }
    
    const result = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    return result;
  }

  // Calculate psychometric scores
  calculatePsychometricScores(section, answers) {
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
    


    return {
      overall,
      categories
    };
  }

  // Calculate psychometric category score
  calculatePsychometricCategory(section, answers, category) {
    // Map expected categories to actual question categories
    const categoryMapping = {
      'interest': ['interest', 'learning-style', 'motivation'],
      'motivation': ['motivation', 'will', 'drive'],
      'personality': ['personality', 'traits', 'character'],
      'cognitive': ['cognitive', 'thinking', 'mental', 'logical-thinking']
    };
    
    const targetCategories = categoryMapping[category] || [category];
    
    const categoryQuestions = section.questions.filter(q => 
      targetCategories.some(target => 
        q.category === target || 
        q.subcategory === target || 
        q.id.includes(target)
      )
    );
    
    if (categoryQuestions.length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const question of categoryQuestions) {
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer) {
        continue;
      }
      
      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }
    
    const result = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    return result;
  }

  // Calculate technical scores
  calculateTechnicalScores(section, answers) {
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
      if ((question.type === 'multipleChoice' || question.type === 'multiple-choice') && score.score > 0) {
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
    


    return {
      overall,
      categories,
      correctAnswers,
      totalQuestions: section.questions.length
    };
  }

  // Calculate technical category score
  calculateTechnicalCategory(section, answers, category) {
    // Map expected categories to actual question categories
    const categoryMapping = {
      'logical': ['logical-thinking', 'logical', 'reasoning', 'problem-solving'],
      'numerical': ['numerical', 'math', 'mathematics', 'calculation'],
      'domain': ['programming-concepts', 'domain', 'knowledge', 'awareness'],
      'problem': ['problem-solving', 'problem', 'solving', 'logical-thinking']
    };
    
    const targetCategories = categoryMapping[category] || [category];
    
    const categoryQuestions = section.questions.filter(q => 
      targetCategories.some(target => 
        q.category === target || 
        q.subcategory === target || 
        q.id.includes(target)
      )
    );
    
    if (categoryQuestions.length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const question of categoryQuestions) {
      const answer = answers.find(a => a.questionId === question.id);
      if (!answer) {
        continue;
      }
      
      const score = this.calculateQuestionScore(question, answer.value);
      totalScore += score.score;
      maxPossibleScore += score.maxScore;
    }
    
    const result = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    return result;
  }

  // Calculate confidence score based on performance consistency
  calculateConfidenceScore(psychometricScores, technicalScores, wiscarScores) {
    const scores = [
      psychometricScores.overall || 0,
      technicalScores.overall || 0,
      wiscarScores.overall || 0
    ];
    
    const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    
    // Calculate consistency (how close the scores are to each other)
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - overallScore, 2), 0) / scores.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));
    
    // Base confidence on overall score with consistency adjustment
    let baseConfidence = 60;
    if (overallScore >= 80) baseConfidence = 95;
    else if (overallScore >= 70) baseConfidence = 85;
    else if (overallScore >= 60) baseConfidence = 75;
    else if (overallScore >= 40) baseConfidence = 65;
    
    // Adjust confidence based on consistency
    const adjustedConfidence = Math.round((baseConfidence + consistency) / 2);
    
    return Math.min(95, Math.max(60, adjustedConfidence));
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
