const express = require('express');
const router = express.Router();

const prisma = require('../db/prisma');

const authRaw = require('../middlewares/auth.middleware');
const auth = authRaw?.default || authRaw?.auth || authRaw; // ✅ supports module.exports = fn OR {auth: fn} OR {default: fn}

if (typeof auth !== 'function') {
  // Fail fast with a clear error in logs
  throw new Error(`auth.middleware export must be a function, got: ${Object.prototype.toString.call(auth)}`);
}

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.auth.userId,
        organizationId: req.auth.orgId,
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        organizationId: true,
        createdAt: true
      }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const organization = await prisma.organization.findFirst({
      where: { id: req.auth.orgId, isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        defaultLanguage: true,
        baseCurrency: true,
        supportedCurrencies: true,
        timezone: true
      }
    });

    if (!organization) return res.status(404).json({ message: 'Organization not found' });

    return res.json({ user, organization });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
