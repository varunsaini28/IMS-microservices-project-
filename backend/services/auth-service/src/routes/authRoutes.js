// import express from 'express';
// import { register, login, refresh, logout, verify, me } from '../controllers/authController.js';
// import { authenticate } from '../middleware/auth.js';

// const router = express.Router();

// router.post('/register', register);
// router.post('/login',    login);
// router.post('/refresh',  refresh);
// router.get('/verify',    verify);
// router.post('/logout',   logout);
// router.get('/me',        authenticate, me); // ✅ add authenticate

// export default router;




import { Router } from 'express';
import {
  initiateRegister,
  verifyRegister,
  resendOtp,
  login,
  refresh,
  logout,
  verify,
  me,
  listUsers,
  getInternalUsers,
} from '../controllers/authController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { internalKey } from '../middleware/internalKey.js';
import { authLimiter, otpLimiter } from '../middleware/Ratelimiter.js';

const router = Router();

// ── Registration (2-step with email OTP) ──────────────────
router.post('/register/initiate', authLimiter, initiateRegister);
router.post('/register/verify',  otpLimiter,  verifyRegister);
router.post('/otp/resend',       otpLimiter,  resendOtp);

// ── Auth ──────────────────────────────────────────────────
router.post('/login',   authLimiter, login);
router.post('/refresh',             refresh);
router.post('/logout',  authenticate, logout);

// ── Session ───────────────────────────────────────────────
router.get('/verify', verify);
router.get('/me',     authenticate, me);

// ── Admin: list users (for assign task/project dropdowns) ──
router.get('/users',   authenticate, requireRole('admin', 'manager'), listUsers);

// ── Internal: list users by role (X-Internal-Key for notification/calendar) ──
router.get('/internal/users', internalKey, getInternalUsers);

export default router;


