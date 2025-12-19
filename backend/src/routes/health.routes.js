// backend/src/routes/health.routes.js
const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    app: 'medcore',
    status: 'ok',
    source: 'health.routes'
  });
});

router.get('/_health', (req, res) => {
  res.json({
    ok: true,
    source: 'health.routes'
  });
});

// ✅ هذا السطر هو المهم
module.exports = router;
