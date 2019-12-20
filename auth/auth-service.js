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
  }
};

module.exports = authService;
