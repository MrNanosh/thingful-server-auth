const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const authService = {
  getUserWithUserName(db, usr_name) {
    return db('thingful_users')
      .where('user_name', usr_name)
      .first();
  },
  parseBasicToken(token) {
    return Buffer.from(token, 'base64')
      .toString()
      .split(':');
  },
  comparePasswords(password, hash) {
    return bcrypt.compare(
      password,
      hash
    );
  },
  createJWT(subject, payload) {
    console.log(subject, payload);
    console.log(
      'secret:',
      config.JWT_SECRET
    );
    return jwt.sign(
      payload,
      config.JWT_SECRET,
      { subject, algorithm: 'HS256' }
    );
  }
};

module.exports = authService;
