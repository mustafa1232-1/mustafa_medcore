const { verifyAccessToken } = require('../modules/auth/auth.utils');

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const [type, token] = h.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }

  try {
    const decoded = verifyAccessToken(token);

    req.auth = {
      userId: decoded.sub,
      orgId: decoded.orgId,
      role: decoded.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = auth;
