const express = require('express');
const router = express.Router();

const {
  registerOrganizationSchema,
  loginSchema,
  refreshSchema,
  logoutSchema
} = require('./auth.validators');

const service = require('./auth.service');

// 🔎 DEBUG: تأكيد تحميل الملف (ستراه في Railway logs)
console.log('✅ auth.routes loaded');

// POST /auth/register-organization
router.post('/register-organization', async (req, res, next) => {
  try {
    const parsed = registerOrganizationSchema.parse(req.body);
    const data = await service.registerOrganization(parsed);
    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
});

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const data = await service.login(parsed);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const parsed = refreshSchema.parse(req.body);
    const data = await service.refresh(parsed);
    return res.json({ tokens: data });
  } catch (err) {
    return next(err);
  }
});

// POST /auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const parsed = logoutSchema.parse(req.body);
    const data = await service.logout(parsed);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
