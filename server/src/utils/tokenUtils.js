const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_jwt_secret_vishnufit_campus_gym_2025_vitb_bhimavaram';
const QR_SECRET = process.env.QR_SECRET || 'vishnufit_smart_qr_campus_token_secret_vitb';

/**
 * Generate standard JWT for user session
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      assignedGym: user.assignedGym,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Verify JWT token string
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Attach HttpOnly session cookie to response
 */
const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

/**
 * Clear HttpOnly session cookie
 */
const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
};

/**
 * Generate a cryptographically signed dynamic QR token
 * Valid for 60 seconds to prevent replay attacks and photo sharing.
 */
const generateQrToken = (data, expirySeconds = 60) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expirySeconds;
  const nonce = crypto.randomBytes(6).toString('hex');

  const payload = {
    sub: data.studentId,
    roll: data.rollNumber,
    gym: data.gymId,
    exp: expiresAt,
    iat: now,
    nonce,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return {
    token: `${payloadBase64}.${signature}`,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
    remainingSeconds: expirySeconds,
  };
};

/**
 * Verify cryptographically signed dynamic QR token
 */
const verifyQrToken = (tokenString) => {
  if (!tokenString || typeof tokenString !== 'string') {
    throw new Error('Invalid QR token format');
  }

  const parts = tokenString.split('.');
  if (parts.length !== 2) {
    throw new Error('Malformed QR token signature');
  }

  const [payloadBase64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    throw new Error('Invalid or tampered QR token signature');
  }

  const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp < now) {
    throw new Error('QR token has expired. Please refresh your membership card.');
  }

  return payload;
};

module.exports = {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  generateQrToken,
  verifyQrToken,
};
