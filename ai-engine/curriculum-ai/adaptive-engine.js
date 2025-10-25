const tf = require('@tensorflow/tfjs-node');
const { AppError } = require('../../../backend/middleware/errorHandler');

class AdaptiveLearningEngine {
  constructor() {
    this.studentModels = new Map();
    this.conceptGraph = this.buildConceptGraph();
    this.difficultyModel = null;
    this.init();
  }

  async init() {
    await this.loadDifficultyModel();
    this.startModelTraining();
  }

  // Build knowledge graph of curriculum concepts
  buildConceptGraph() {
    return {
      'mathematics': {
        'grade_1': ['counting', 'addition_basic', 'shapes'],
        'grade_2': ['addition', 'subtraction', 'time', 'money'],
        'grade_3': ['multiplication', 'division', 'fractions', 'measurement'],
        'grade_4': ['decimals', 'geometry', 'word_problems'],
        'dependencies': {
          'addition': ['counting'],
          'multiplication': ['addition'],
          'fractions': ['division']
        }
      },
      'science': {
        'grade_1': ['plants', 'animals', 'weather'],
        'grade_2': ['habitats', 'matter', 'solar_system'],
        'grade_3': ['ecosystems', 'energy', 'magnets'],
        'grade_4': ['electricity', 'human_body', 'environment']
      }
    };
  }

  // Predict optimal learning path for student
  async predictLearningPath(studentId, subject, currentLevel) {
    const studentData = await this.getStudentData(studentId);
    const conceptMastery = await this.calculateConceptMastery(studentData, subject);
    
    const recommendations = this.generateRecommendations(
      conceptMastery, 
      subject, 
      currentLevel
    );

    return {
      nextConcepts: recommendations.nextConcepts,
      practiceAreas: recommendations.weakAreas,
      predictedDifficulty: recommendations.difficulty,
      estimatedTime: this.estimateCompletionTime(recommendations),
      confidenceScore: recommendations.confidence
    };
  }

  async calculateConceptMastery(studentData, subject) {
    const attempts = studentData.attempts.filter(a => a.subject === subject);
    const recentScores = attempts.slice(-20).map(a => a.score);
    
    const mastery = {};
    const concepts = this.conceptGraph[subject][`grade_${studentData.grade}`];
    
    concepts.forEach(concept => {
      const conceptScores = attempts
        .filter(a => a.concept === concept)
        .map(a => a.score);
      
      mastery[concept] = conceptScores.length > 0 ? 
        conceptScores.reduce((a, b) => a + b) / conceptScores.length : 0;
    });

    return mastery;
  }

  generateRecommendations(mastery, subject, currentLevel) {
    const weakAreas = Object.entries(mastery)
      .filter(([concept, score]) => score < 70)
      .map(([concept]) => concept);

    const strongAreas = Object.entries(mastery)
      .filter(([concept, score]) => score >= 85)
      .map(([concept]) => concept);

    // Find next concepts based on dependencies
    const nextConcepts = this.findNextConcepts(strongAreas, subject, currentLevel);

    return {
      weakAreas,
      strongAreas,
      nextConcepts,
      difficulty: this.calculateOptimalDifficulty(mastery),
      confidence: this.calculateConfidence(mastery)
    };
  }

  findNextConcepts(masteredConcepts, subject, grade) {
    const availableConcepts = this.conceptGraph[subject][`grade_${grade}`];
    const dependencies = this.conceptGraph[subject].dependencies || {};
    
    return availableConcepts.filter(concept => {
      const prereqs = dependencies[concept] || [];
      return prereqs.every(prereq => masteredConcepts.includes(prereq));
    });
  }

  calculateOptimalDifficulty(mastery) {
    const avgMastery = Object.values(mastery).reduce((a, b) => a + b, 0) / Object.values(mastery).length;
    
    if (avgMastery < 50) return 'easy';
    if (avgMastery < 80) return 'medium';
    return 'hard';
  }

  // Real-time difficulty adjustment
  adjustDifficulty(question, studentPerformance, subject) {
    const baseDifficulty = question.difficulty;
    const performanceRate = studentPerformance.correct / studentPerformance.total;
    
    let adjustment = 0;
    if (performanceRate > 0.8) adjustment = 1; // Increase difficulty
    if (performanceRate < 0.4) adjustment = -1; // Decrease difficulty
    
    return Math.max(1, Math.min(5, baseDifficulty + adjustment));
  }

  // Machine Learning model for difficulty prediction
  async loadDifficultyModel() {
    try {
      this.difficultyModel = await tf.loadLayersModel('file://./models/difficulty-predictor/model.json');
    } catch (error) {
      console.log('No pre-trained model found, using rule-based system');
      this.difficultyModel = null;
    }
  }

  async trainStudentModel(studentId, trainingData) {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' })
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    const xs = tf.tensor2d(trainingData.features);
    const ys = tf.tensor2d(trainingData.labels);

    await model.fit(xs, ys, {
      epochs: 50,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Student ${studentId} model - Epoch ${epoch}: loss = ${logs.loss}`);
          }
        }
      }
    });

    this.studentModels.set(studentId, model);
  }

  startModelTraining() {
    // Periodic model retraining
    setInterval(async () => {
      try {
        await this.retrainAllModels();
      } catch (error) {
        console.error('Model retraining failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Daily retraining
  }

  async retrainAllModels() {
    const { User, LearningProgress } = require('../../../backend/models');
    
    const users = await User.findAll({
      include: [LearningProgress],
      where: { role: 'student' }
    });

    for (const user of users) {
      const trainingData = this.prepareTrainingData(user.LearningProgresses);
      if (trainingData.features.length > 0) {
        await this.trainStudentModel(user.id, trainingData);
      }
    }
  }

  prepareTrainingData(progressData) {
    const features = [];
    const labels = [];

    progressData.forEach((progress, index) => {
      if (index < 10) return; // Need minimum data
      
      const recentScores = progressData
        .slice(Math.max(0, index - 10), index)
        .map(p => p.score);
      
      const feature = [
        ...recentScores,
        progress.timeSpent / 60, // Convert to minutes
        progress.attempts,
        progress.hintsUsed
      ];

      // Pad features if needed
      while (feature.length < 10) feature.push(0);

      features.push(feature.slice(0, 10));
      
      // Label: 0=easy, 1=medium, 2=hard
      const label = progress.score < 50 ? 0 : progress.score < 80 ? 1 : 2;
      labels.push([label === 0 ? 1 : 0, label === 1 ? 1 : 0, label === 2 ? 1 : 0]);
    });

    return { features, labels };
  }
}

module.exports = AdaptiveLearningEngine;