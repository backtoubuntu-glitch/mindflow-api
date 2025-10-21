const express = require('express');
const router = express.Router();
const { developmentBypass } = require('../middleware/development');

router.use(developmentBypass);

router.post('/register', (req, res) => {
  res.json({
    success: true,
    message: 'Company registration submitted for approval',
    data: {
      company: {
        id: 'comp-' + Date.now(),
        name: req.body.name,
        email: req.body.email,
        status: 'pending'
      },
      user: {
        id: 'user-' + Date.now(),
        email: req.body.adminUser.email,
        firstName: req.body.adminUser.firstName,
        lastName: req.body.adminUser.lastName,
        role: 'company_admin'
      },
      token: 'mock-jwt-token-' + Date.now()
    }
  });
});

module.exports = router;
