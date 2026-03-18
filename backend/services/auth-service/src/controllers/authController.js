
// import bcrypt from 'bcrypt';
// import { pgPool } from '../config/database.js';
// import { redisClient } from '../config/redis.js';
// import { publishEvent } from '../config/rabbitmq.js';
// import {
//   generateAccessToken,
//   generateRefreshToken,
//   verifyAccessToken,
//   verifyRefreshToken
// } from '../services/tokenService.js';

// // ─── Register ──────────────────────────────────────────────
// export const register = async (req, res, next) => {
//   console.log('[Register] Request body:', req.body);
//   const { email, password, fullName, role = 'intern' } = req.body;
//   try {
//     console.log('[Register] Hashing password...');
//     const hashedPassword = await bcrypt.hash(password, 10);

//     console.log('[Register] Inserting user into DB...');
//     const result = await pgPool.query(
//       `INSERT INTO users (email, password_hash, full_name, role)
//        VALUES ($1, $2, $3, $4)
//        RETURNING id, email, role, full_name`,
//       [email, hashedPassword, fullName, role]
//     );
//     const user = result.rows[0];
//     console.log('[Register] DB insert result:', user);

//     await publishEvent('auth.user.registered', {
//       userId: user.id,
//       email: user.email,
//       fullName: user.full_name,
//       role: user.role,
//       timestamp: new Date().toISOString()
//     });
//     console.log('[Register] Event published');

//     res.status(201).json(user);
//   } catch (error) {
//     console.error('[Register] Error:', error);
//     next(error);
//   }
// };

// // ─── Login ─────────────────────────────────────────────────
// export const login = async (req, res, next) => {
//   const { email, password } = req.body;
//   try {
//     const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
//     const user = result.rows[0];
//     if (!user) return res.status(401).json({ error: 'Invalid credentials' });

//     const valid = await bcrypt.compare(password, user.password_hash);
//     if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

//     const accessToken = generateAccessToken(user);
//     const refreshToken = generateRefreshToken(user.id);

//     // Store refresh token in DB
//     await pgPool.query(
//       `INSERT INTO refresh_tokens (user_id, token, expires_at)
//        VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
//       [user.id, refreshToken]
//     );

//     // Store session in Redis (15 minutes)
//     await redisClient.setEx(
//       `session:${accessToken}`,
//       900,
//       JSON.stringify({ id: user.id, role: user.role })
//     );

//     res.json({
//       accessToken,
//       refreshToken,
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         fullName: user.full_name
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // ─── Refresh Token ─────────────────────────────────────────
// export const refresh = async (req, res, next) => {
//   const { refreshToken } = req.body;
//   if (!refreshToken) return res.status(400).json({ error: 'No refresh token provided' });

//   try {
//     const decoded = verifyRefreshToken(refreshToken);

//     // Check refresh token exists in DB and not expired
//     const result = await pgPool.query(
//       'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
//       [refreshToken]
//     );
//     if (result.rows.length === 0) {
//       return res.status(401).json({ error: 'Invalid or expired refresh token' });
//     }

//     // Get user
//     const userResult = await pgPool.query(
//       'SELECT * FROM users WHERE id = $1',
//       [decoded.id]
//     );
//     const user = userResult.rows[0];
//     if (!user) return res.status(401).json({ error: 'User not found' });

//     // Generate new access token
//     const newAccessToken = generateAccessToken(user);

//     // Store new session in Redis
//     await redisClient.setEx(
//       `session:${newAccessToken}`,
//       900,
//       JSON.stringify({ id: user.id, role: user.role })
//     );

//     res.json({
//       accessToken: newAccessToken,
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         fullName: user.full_name
//       }
//     });
//   } catch (err) {
//     res.status(401).json({ error: 'Invalid refresh token' });
//   }
// };

// // ─── Logout ────────────────────────────────────────────────
// export const logout = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   const { refreshToken } = req.body;

//   if (!token) return res.status(400).json({ error: 'No token provided' });

//   try {
//     // Delete session from Redis
//     await redisClient.del(`session:${token}`);

//     // Delete refresh token from DB
//     if (refreshToken) {
//       await pgPool.query(
//         'DELETE FROM refresh_tokens WHERE token = $1',
//         [refreshToken]
//       );
//     }

//     await publishEvent('auth.user.loggedout', {
//       timestamp: new Date().toISOString()
//     });

//     res.json({ message: 'Logged out successfully' });
//   } catch (err) {
//     next(err);
//   }
// };

// // ─── Verify (for gateway) ──────────────────────────────────
// export const verify = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ error: 'No token' });

//   try {
//     const decoded = verifyAccessToken(token);

//     // Check Redis session
//     const session = await redisClient.get(`session:${token}`);
//     if (!session) return res.status(401).json({ error: 'Session expired' });

//     res.json({ valid: true, user: decoded });
//   } catch {
//     res.status(401).json({ error: 'Invalid token' });
//   }
// };

// // ─── Get Current User ──────────────────────────────────────
// export const me = async (req, res, next) => {
//   try {
//     const result = await pgPool.query(
//       'SELECT id, email, role, full_name FROM users WHERE id = $1',
//       [req.user.id]
//     );
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     const user = result.rows[0];
//     res.json({
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         fullName: user.full_name
//       }
//     });
//   } catch (err) {
//     next(err);
//   }
// };










import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pgPool } from '../config/database.js';
import { redisClient } from '../config/redis.js';
import { publishEvent } from '../config/rabbitmq.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from '../services/tokenService.js';

// ─── Helpers ────────────────────────────────────────────────
const OTP_TTL_SECONDS = 600;         // 10 minutes
const PENDING_REGISTRATION_TTL = 60; // 15 minutes

const generateOtp = () =>
  crypto.randomInt(100000, 999999).toString();

const otpKey     = (email) => `otp:register:${email}`;
const pendingKey = (email) => `pending:register:${email}`;

// ─── Register: Step 1 — Initiate ────────────────────────────
// POST /auth/register/initiate
// Stores pending data + OTP in Redis, then fires a RabbitMQ event.
// Notification-service consumes the event and sends the email.
export const initiateRegister = async (req, res, next) => {
  const { email, password, fullName, role = 'intern' } = req.body;

  try {
    // 1. Check duplicate email
    const existing = await pgPool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Store pending registration in Redis
    await redisClient.setEx(
      pendingKey(email),
      PENDING_REGISTRATION_TTL,
      JSON.stringify({ email, hashedPassword, fullName, role })
    );

    // 4. Generate OTP and store in Redis
    const otp = generateOtp();
    await redisClient.setEx(otpKey(email), OTP_TTL_SECONDS, otp);

    // 5. Publish event → notification-service will send the email
    //    Routing key: auth.otp.requested
    await publishEvent('auth.otp.requested', {
      type: 'OTP_REGISTRATION',
      email,
      fullName,
      otp,
      expiresInMinutes: 10,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Verification code sent', email });
  } catch (error) {
    console.error('[initiateRegister] Error:', error);
    next(error);
  }
};

// ─── Register: Step 2 — Verify OTP ──────────────────────────
// POST /auth/register/verify
export const verifyRegister = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    // 1. Validate OTP from Redis
    const storedOtp = await redisClient.get(otpKey(email));
    if (!storedOtp) {
      return res.status(400).json({
        error: 'OTP expired or not found. Please register again.',
      });
    }
    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // 2. Get pending registration data
    const pendingRaw = await redisClient.get(pendingKey(email));
    if (!pendingRaw) {
      return res.status(400).json({
        error: 'Registration session expired. Please start over.',
      });
    }
    const { hashedPassword, fullName, role } = JSON.parse(pendingRaw);

    // 3. Insert user into DB
    const result = await pgPool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, full_name`,
      [email, hashedPassword, fullName, role]
    );
    const user = result.rows[0];

    // 4. Cleanup Redis
    await Promise.all([
      redisClient.del(otpKey(email)),
      redisClient.del(pendingKey(email)),
    ]);

    // 5. Generate tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // 6. Persist refresh token
    await pgPool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

    // 7. Store session in Redis
    await redisClient.setEx(
      `session:${accessToken}`,
      900,
      JSON.stringify({ id: user.id, role: user.role })
    );

    // 8. Publish registration success event
    //    notification-service can send a welcome email from here too
    await publishEvent('auth.user.registered', {
      userId:    user.id,
      email:     user.email,
      fullName:  user.full_name,
      role:      user.role,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id:       user.id,
        email:    user.email,
        role:     user.role,
        fullName: user.full_name,
      },
    });
  } catch (error) {
    console.error('[verifyRegister] Error:', error);
    next(error);
  }
};

// ─── Resend OTP ──────────────────────────────────────────────
// POST /auth/otp/resend
export const resendOtp = async (req, res, next) => {
  const { email } = req.body;

  try {
    // Only resend if pending registration still exists
    const pendingRaw = await redisClient.get(pendingKey(email));
    if (!pendingRaw) {
      return res.status(400).json({
        error: 'No pending registration found. Please register again.',
      });
    }

    const { fullName } = JSON.parse(pendingRaw);
    const otp = generateOtp();
    await redisClient.setEx(otpKey(email), OTP_TTL_SECONDS, otp);

    // Publish resend event → notification-service sends new email
    await publishEvent('auth.otp.requested', {
      type: 'OTP_RESEND',
      email,
      fullName,
      otp,
      expiresInMinutes: 10,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'New code sent' });
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────────────────────
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await pgPool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    await pgPool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken]
    );

    await redisClient.setEx(
      `session:${accessToken}`,
      900,
      JSON.stringify({ id: user.id, role: user.role })
    );

    // Publish login event (audit / analytics)
    await publishEvent('auth.user.loggedin', {
      userId:    user.id,
      email:     user.email,
      role:      user.role,
      timestamp: new Date().toISOString(),
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id:       user.id,
        email:    user.email,
        role:     user.role,
        fullName: user.full_name,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ───────────────────────────────────────────
export const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: 'No refresh token provided' });

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const result = await pgPool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const userResult = await pgPool.query(
      'SELECT * FROM users WHERE id = $1',
      [decoded.id]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccessToken = generateAccessToken(user);

    await redisClient.setEx(
      `session:${newAccessToken}`,
      900,
      JSON.stringify({ id: user.id, role: user.role })
    );

    res.json({
      accessToken: newAccessToken,
      user: {
        id:       user.id,
        email:    user.email,
        role:     user.role,
        fullName: user.full_name,
      },
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// ─── Logout ──────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { refreshToken } = req.body;

  if (!token) return res.status(400).json({ error: 'No token provided' });

  try {
    await redisClient.del(`session:${token}`);

    if (refreshToken) {
      await pgPool.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );
    }

    await publishEvent('auth.user.loggedout', {
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Verify (for gateway) ────────────────────────────────────
export const verify = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = verifyAccessToken(token);
    const session = await redisClient.get(`session:${token}`);
    if (!session) return res.status(401).json({ error: 'Session expired' });
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Get Current User ─────────────────────────────────────────
export const me = async (req, res, next) => {
  try {
    const result = await pgPool.query(
      'SELECT id, email, role, full_name FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({
      user: {
        id:       user.id,
        email:    user.email,
        role:     user.role,
        fullName: user.full_name,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── List Users (admin/manager only) ───────────────────────────
export const listUsers = async (req, res, next) => {
  try {
    const result = await pgPool.query(
      'SELECT id, email, role, full_name FROM users ORDER BY full_name, email'
    );
    res.json(result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      fullName: row.full_name,
    })));
  } catch (err) {
    next(err);
  }
};

// ─── Internal: list users by role (service-to-service, X-Internal-Key) ──
export const getInternalUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const result = await pgPool.query(
      'SELECT id, email, role, full_name FROM users WHERE ($1::text IS NULL OR role = $1) ORDER BY email',
      [role || null]
    );
    res.json(result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      fullName: row.full_name,
    })));
  } catch (err) {
    next(err);
  }
};