// backend/src/modules/auth/auth.routes.js
const express = require('express');
const path = require('path');

const router = express.Router();

const validatorsPath = path.join(__dirname, 'auth.validators.js');
console.log('✅ auth.routes loaded');
console.log('✅ __dirname:', __dirname);
console.log('✅ validatorsPath:', validatorsPath);

let validators;
try {
  validators = require('./auth.validators');
  console.log('✅ validators loaded OK');
} catch (e) {
  console.log('❌ validators require FAILED:', e.message);
  throw e;
}

console.log('✅ auth.validators keys:', Object.keys(validators || {}));


const {
  registerOrganizationSchema,
  loginSchema,
  refreshSchema,
  logoutSchema
} = validators || {};

// ✅ حماية: إذا أي schema طلعت undefined نوقف فوراً برسالة واضحة
function assertSchema(name, schema) {
  if (!schema || typeof schema.parse !== 'function') {
    throw new Error(
      `${name} is not a Zod schema. Got: ${Object.prototype.toString.call(schema)} ` +
      `| validators keys: [${Object.keys(validators || {}).join(', ')}]`
    );
  }
}

assertSchema('registerOrganizationSchema', registerOrganizationSchema);
assertSchema('loginSchema', loginSchema);
assertSchema('refreshSchema', refreshSchema);
assertSchema('logoutSchema', logoutSchema);

// ✅ quick ping
router.get('/_ping', (req, res) => res.json({ ok: true, module: 'auth.routes' }));

// ✅ list registered routes (debug)
router.get('/_routes', (req, res) => {
  const routes = router.stack
    .filter((l) => l.route)
    .map((l) => ({
      path: l.route.path,
      methods: Object.keys(l.route.methods)
    }));
  return res.json({ routes });
});

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
