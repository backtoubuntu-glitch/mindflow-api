// MindFlow AI - Complete 2025 Curriculum System
// =============================================

class Curriculum2025 {
    constructor() {
        this.API_BASE = 'https://mindflow-ai.onrender.com/api';
        this.gradeLevels = {
            elementary: { grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] },
            middle: { grades: ['Grade 6', 'Grade 7', 'Grade 8'] },
            high: { grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] }
        };
        this.subjects = this.getCurriculumSubjects();
        this.init();
    }

    init() {
        console.log('📚 2025 Curriculum System Initialized');
        this.loadCurriculumStructure();
        this.setupProgressTracking();
    }

    getCurriculumSubjects() {
        return {
            mathematics: {
                title: "Mathematics & Analytics",
                topics: [
                    "Number Sense & Operations",
                    "Algebra & Equations", 
                    "Geometry & Spatial Reasoning",
                    "Data Analysis & Probability",
                    "Financial Literacy",
                    "AI Mathematics Fundamentals"
                ],
                skills: ["Critical Thinking", "Problem Solving", "Data Analysis", "Logical Reasoning"]
            },
            science: {
                title: "Science & Technology", 
                topics: [
                    "Life Sciences & Biology",
                    "Physical Sciences & Chemistry",
                    "Earth & Space Sciences",
                    "Scientific Method & Inquiry",
                    "Technology & Engineering",
                    "Environmental Science"
                ],
                skills: ["Scientific Inquiry", "Experimental Design", "Technical Literacy", "Innovation"]
            },
            language: {
                title: "Language & Communication",
                topics: [
                    "Reading Comprehension",
                    "Writing & Composition", 
                    "Grammar & Vocabulary",
                    "Oral Communication",
                    "Digital Literacy",
                    "African Languages & Culture"
                ],
                skills: ["Communication", "Critical Reading", "Creative Writing", "Cultural Awareness"]
            },
            computer_science: {
                title: "Computer Science & AI",
                topics: [
                    "Computational Thinking",
                    "Programming Fundamentals",
                    "Data Structures & Algorithms",
                    "Artificial Intelligence",
                    "Robotics & Automation", 
                    "Cybersecurity Basics"
                ],
                skills: ["Computational Thinking", "Coding", "System Design", "AI Literacy"]
            },
            social_studies: {
                title: "Social Studies & Leadership",
                topics: [
                    "African History & Heritage",
                    "Civics & Government",
                    "Geography & Environmental Studies",
                    "Economics & Entrepreneurship",
                    "Global Perspectives",
                    "Leadership & Ethics"
                ],
                skills: ["Cultural Understanding", "Civic Engagement", "Ethical Reasoning", "Leadership"]
            }
        };
    }

    async loadCurriculumStructure() {
        try {
            const response = await fetch(`${this.API_BASE}/curriculum/structure`);
            if (response.ok) {
                const curriculum = await response.json();
                this.curriculumData = curriculum;
            } else {
                // Use local curriculum structure
                this.curriculumData = this.generateLocalCurriculum();
            }
        } catch (error) {
            console.log('Using local curriculum structure');
            this.curriculumData = this.generateLocalCurriculum();
        }
    }

    generateLocalCurriculum() {
        const curriculum = {};
        
        Object.keys(this.gradeLevels).forEach(level => {
            curriculum[level] = {};
            this.gradeLevels[level].grades.forEach(grade => {
                curriculum[level][grade] = {};
                Object.keys(this.subjects).forEach(subject => {
                    curriculum[level][grade][subject] = {
                        modules: this.generateModulesForSubject(subject, grade),
                        assessments: this.generateAssessments(subject, grade),
                        resources: this.generateResources(subject, grade)
                    };
                });
            });
        });
        
        return curriculum;
    }

    generateModulesForSubject(subject, grade) {
        const baseModules = [
            {
                id: `${subject}_fundamentals`,
                title: `${this.subjects[subject].title} Fundamentals`,
                duration: "4 weeks",
                objectives: ["Master core concepts", "Develop foundational skills"],
                activities: ["Interactive lessons", "Practice exercises", "Knowledge checks"]
            },
            {
                id: `${subject}_application`,
                title: `Applied ${this.subjects[subject].title}`,
                duration: "3 weeks", 
                objectives: ["Apply concepts to real-world scenarios", "Develop problem-solving skills"],
                activities: ["Project-based learning", "Case studies", "Collaborative work"]
            },
            {
                id: `${subject}_advanced`,
                title: `Advanced ${this.subjects[subject].title}`,
                duration: "3 weeks",
                objectives: ["Explore advanced topics", "Develop critical thinking"],
                activities: ["Research projects", "Analytical exercises", "Creative applications"]
            }
        ];
        
        return baseModules;
    }

    async getStudentProgress(studentId) {
        try {
            const response = await fetch(`${this.API_BASE}/curriculum/progress/${studentId}`);
            if (response.ok) {
                return await response.json();
            }
            return this.generateSampleProgress();
        } catch (error) {
            return this.generateSampleProgress();
        }
    }

    generateSampleProgress() {
        return {
            overallProgress: 65,
            subjectProgress: {
                mathematics: { completed: 70, currentModule: "Algebra Fundamentals" },
                science: { completed: 60, currentModule: "Scientific Method" },
                language: { completed: 80, currentModule: "Advanced Composition" },
                computer_science: { completed: 45, currentModule: "Programming Basics" },
                social_studies: { completed: 70, currentModule: "African History" }
            },
            recentAchievements: [
                "Mathematics Mastery - Algebra",
                "Science Explorer Badge", 
                "Writing Excellence Award"
            ]
        };
    }

    setupProgressTracking() {
        // Initialize progress tracking system
        this.progressTracker = {
            trackActivity: (studentId, activity, score) => {
                console.log(`Tracking activity: ${activity} for student ${studentId}`);
                this.updateProgress(studentId, activity, score);
            },
            generateReport: (studentId) => {
                return this.generateProgressReport(studentId);
            }
        };
    }

    async updateProgress(studentId, activity, score) {
        try {
            await fetch(`${this.API_BASE}/curriculum/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId,
                    activity,
                    score,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.log('Progress update failed, storing locally');
            this.storeProgressLocally(studentId, activity, score);
        }
    }

    storeProgressLocally(studentId, activity, score) {
        const key = `mindflow_progress_${studentId}`;
        let progress = JSON.parse(localStorage.getItem(key) || '{}');
        
        if (!progress.activities) progress.activities = [];
        progress.activities.push({ activity, score, timestamp: new Date().toISOString() });
        
        localStorage.setItem(key, JSON.stringify(progress));
    }

    generateProgressReport(studentId) {
        const progress = this.getStudentProgress(studentId);
        return {
            studentId,
            generatedAt: new Date().toISOString(),
            summary: {
                overallProgress: progress.overallProgress,
                strengths: this.identifyStrengths(progress),
                areasForImprovement: this.identifyImprovementAreas(progress),
                recommendations: this.generateRecommendations(progress)
            },
            detailedProgress: progress.subjectProgress
        };
    }

    identifyStrengths(progress) {
        const strengths = [];
        Object.keys(progress.subjectProgress).forEach(subject => {
            if (progress.subjectProgress[subject].completed >= 80) {
                strengths.push(this.subjects[subject].title);
            }
        });
        return strengths;
    }

    identifyImprovementAreas(progress) {
        const areas = [];
        Object.keys(progress.subjectProgress).forEach(subject => {
            if (progress.subjectProgress[subject].completed <= 50) {
                areas.push(this.subjects[subject].title);
            }
        });
        return areas;
    }

    generateRecommendations(progress) {
        const recommendations = [];
        
        if (progress.overallProgress < 50) {
            recommendations.push("Increase study time in core subjects");
            recommendations.push("Focus on foundational concepts");
        }
        
        Object.keys(progress.subjectProgress).forEach(subject => {
            if (progress.subjectProgress[subject].completed < 60) {
                recommendations.push(`Additional practice needed in ${this.subjects[subject].title}`);
            }
        });
        
        return recommendations;
    }

    // Corporate sponsorship integration
    async getSponsoredContent() {
        try {
            const response = await fetch(`${this.API_BASE}/corporate/sponsored-content`);
            if (response.ok) {
                return await response.json();
            }
            return this.generateSampleSponsoredContent();
        } catch (error) {
            return this.generateSampleSponsoredContent();
        }
    }

    generateSampleSponsoredContent() {
        return {
            mathematics: [
                {
                    sponsor: "MTN Foundation",
                    module: "Digital Mathematics",
                    resources: ["Interactive calculators", "Real-world problem sets"],
                    branding: "Supported by MTN Foundation"
                }
            ],
            science: [
                {
                    sponsor: "Sasol STEM Initiative", 
                    module: "Energy Science",
                    resources: ["Virtual lab experiments", "Career exploration"],
                    branding: "Powered by Sasol STEM"
                }
            ],
            computer_science: [
                {
                    sponsor: "Google Africa",
                    module: "AI & Machine Learning",
                    resources: ["Coding challenges", "Industry projects"],
                    branding: "In partnership with Google"
                }
            ]
        };
    }
}

// Global curriculum instance
document.addEventListener('DOMContentLoaded', function() {
    window.mindflowCurriculum = new Curriculum2025();
});