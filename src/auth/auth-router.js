const express = require('express');
const jsonBodyParser = express.json();
const authRouter = express.Router();
const authService = require('../auth/auth-service');

authRouter.post(
  '/login',
  jsonBodyParser,
  (req, res, next) => {
    const {
      user_name,
      password
    } = req.body;
    const login_user = {
      user_name,
      password
    };
    for (const [
      key,
      item
    ] of Object.entries(login_user)) {
      if (!item) {
        return res.status(400).json({
          error: `Missing ${key} in request body`
        });
      }
    }
    authService
      .getUserWithUserName(
        req.app.get('db'),
        login_user.user_name
      )
      .then(user => {
        if (!user) {
          return res.status(400).json({
            error:
              'bad user name or password'
          });
        }
        res.send('ok');
      })
      .catch(next);
  }
);

module.exports = authRouter;
