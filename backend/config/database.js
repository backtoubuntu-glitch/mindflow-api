const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

// Emergency fallback for development
const getDatabaseConfig = () => {
    // If DATABASE_URL is provided, use it
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL,
            dialect: 'postgres',
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            logging: process.env.NODE_ENV === 'development' ? console.log : false
        };
    }
    
    // Development fallback - SQLite for quick start
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_DB_CHECK) {
        console.log('⚠️  Using SQLite for development - switch to PostgreSQL for production');
        return {
            dialect: 'sqlite',
            storage: './database.sqlite',
            logging: false
        };
    }
    
    throw new Error('DATABASE_URL is required for production');
};

const sequelize = new Sequelize(getDatabaseConfig());

// Test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection established successfully.');
        
        // Sync database in development
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ force: false });
            logger.info('Database synchronized successfully.');
        }
    } catch (error) {
        logger.error('Unable to connect to the database:', error.message);
        
        if (process.env.NODE_ENV === 'development' && process.env.SKIP_DB_CHECK) {
            console.log('🔄 Continuing in development mode without database...');
            return;
        }
        
        process.exit(1);
    }
};

// Graceful shutdown
const closeConnection = async () => {
    try {
        await sequelize.close();
        logger.info('Database connection closed.');
    } catch (error) {
        logger.error('Error closing database connection:', error);
    }
};

module.exports = {
    sequelize,
    testConnection,
    closeConnection
};
