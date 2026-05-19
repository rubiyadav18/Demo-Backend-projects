const authService = require('../services/authService');

class AuthController {
  async signup(req, res) {
    try {
      const result = await authService.signup(req.body);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          ...(error.errors && { errors: error.errors }),
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Email is already registered',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error creating account',
        error: error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const result = await authService.login(req.body);

      return res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          ...(error.errors && { errors: error.errors }),
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error logging in',
        error: error.message,
      });
    }
  }
}

module.exports = new AuthController();
