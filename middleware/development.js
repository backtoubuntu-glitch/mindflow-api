// Development middleware to bypass auth in development
const developmentBypass = (req, res, next) => {
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
        // Mock user for development
        req.user = {
            id: 'dev-user-123',
            email: 'developer@mindflow.ai',
            firstName: 'Developer',
            lastName: 'User',
            role: 'student',
            grade: 4,
            companyId: null
        };
        return next();
    }
    next();
};

// Mock authentication for development
const mockAuth = (req, res, next) => {
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Still allow through but with mock user
            req.user = {
                id: 'dev-user-123',
                email: 'developer@mindflow.ai', 
                firstName: 'Developer',
                lastName: 'User',
                role: 'student',
                grade: 4,
                companyId: null
            };
        }
    }
    next();
};

module.exports = {
    developmentBypass,
    mockAuth
};
