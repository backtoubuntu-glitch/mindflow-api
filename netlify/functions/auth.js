<<<<<<< HEAD
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: '🚀 MindFlow AI Backend Running!',
      timestamp: new Date().toISOString(),
      environment: 'production',
      endpoints: {
        health: '/.netlify/functions/health',
        curriculum: '/.netlify/functions/curriculum',
        auth: '/.netlify/functions/auth'
      }
    })
  };
=======
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: '🚀 MindFlow AI Backend Running!',
      timestamp: new Date().toISOString(),
      environment: 'production',
      endpoints: {
        health: '/.netlify/functions/health',
        curriculum: '/.netlify/functions/curriculum',
        auth: '/.netlify/functions/auth'
      }
    })
  };
>>>>>>> 47e74d6862922efadb4373ca2a0a2a41fcbfc6e0
};