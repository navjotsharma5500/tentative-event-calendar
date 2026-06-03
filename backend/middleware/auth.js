function requireAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin password' });
  }
  next();
}

module.exports = { requireAdmin };
