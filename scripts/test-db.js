require('dotenv').config();
const { testConnection } = require('../config/database');

console.log('🛠️ Testing database connection...');

testConnection()
  .then(() => {
    console.log('✅ Database connection successful!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });