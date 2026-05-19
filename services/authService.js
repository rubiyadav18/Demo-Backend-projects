const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateSignupInput({ name, email, password }) {
  const errors = [];

  if (!name || String(name).trim() === '') {
    errors.push('Name is required');
  } else if (String(name).trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || String(password).length === 0) {
    errors.push('Password is required');
  } else if (String(password).length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (errors.length) {
    const err = new Error(errors[0]);
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }

  return {
    name: String(name).trim(),
    email: normalizedEmail,
    password: String(password),
  };
}

function validateLoginInput({ email, password }) {
  const errors = [];

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || String(password).length === 0) {
    errors.push('Password is required');
  }

  if (errors.length) {
    const err = new Error(errors[0]);
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }

  return {
    email: normalizedEmail,
    password: String(password),
  };
}

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured on the server');
    err.statusCode = 500;
    throw err;
  }

  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

class AuthService {
  async signup(payload) {
    const { name, email, password } = validateSignupInput(payload);

    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('Email is already registered');
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = signToken(user._id);

    return {
      user: formatUser(user),
      token,
    };
  }

  async login(payload) {
    const { email, password } = validateLoginInput(payload);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const token = signToken(user._id);

    return {
      user: formatUser(user),
      token,
    };
  }
}

module.exports = new AuthService();
