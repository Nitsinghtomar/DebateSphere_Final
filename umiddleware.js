const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');


const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};


const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        ((parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7) *
          24 *
          60 *
          60 *
          1000)
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);


  user.passwordHash = undefined;

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: { user }
  });
};


const requireAuth = async (req, res, next) => {
  try {
    let token;

   
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. Please log in first.'
      });
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

   
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User linked to this token no longer exists.'
      });
    }

    
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Contact support.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    const errorResponse = {
      status: 'error',
      message: 'Authentication failed.'
    };

    if (err.name === 'JsonWebTokenError') {
      errorResponse.message = 'Invalid token. Please log in again.';
    } else if (err.name === 'TokenExpiredError') {
      errorResponse.message = 'Session expired. Please log in again.';
    } else if (process.env.NODE_ENV === 'development') {
      errorResponse.error = err.message;
    }

    res.status(401).json(errorResponse);
  }
};


const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission for this action.'
      });
    }
    next();
  };
};


const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch {
    
  } finally {
    next();
  }
};


const checkLoggedIn = async (req, res, next) => {
  if (req.cookies?.jwt) {
    try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        res.locals.user = user;
        return next();
      }
    } catch {

    }
  }
  next();
};


const authRateLimiter = (windowMs = 15 * 60 * 1000, max = 5) =>
  rateLimit({
    windowMs,
    max,
    message: {
      status: 'error',
      message: 'Too many login attempts. Try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

module.exports = {
  generateToken,
  sendTokenResponse,
  requireAuth,
  authorizeRoles,
  optionalAuth,
  checkLoggedIn,
  authRateLimiter
};
