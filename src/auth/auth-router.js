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
        console.log('some stuff item');
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
          console.log(
            'some stuff not user'
          );
          return res.status(400).json({
            error:
              'bad user name or password'
          });
        }
        authService
          .comparePasswords(
            login_user.password,
            user.password
          )
          .then(compareMatch => {
            if (!compareMatch) {
              console.log(
                'some compare match'
              );
              return res
                .status(400)
                .json({
                  error:
                    'bad user name or password'
                });
            }

            //sending a JSON Web Token if all is good
            const subject =
              user.user_name;
            const payload = {
              user_id: user.id
            };
            console.log(
              subject,
              payload
            );
            return res.send({
              authToken: authService.createJWT(
                subject,
                payload
              )
            });
          });
      })
      .catch(next);
  }
);

module.exports = authRouter;
