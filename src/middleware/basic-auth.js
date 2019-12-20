const authService = require('../auth/auth-service');
const bcrypt = require('bcryptjs');

function requireAuth(req, res, next) {
  const authToken =
    req.get('Authorization') || '';
  //look for a basic token and if not return 404
  let basicToken;
  if (
    !authToken
      .toLowerCase()
      .startsWith('basic ')
  ) {
    res.status(401).json({
      error: 'Missing basic token'
    });
  } else {
    //remove the basic part
    basicToken = authToken.slice(
      'basic '.length,
      authToken.length
    );
  }
  //destruct the authToken received and decode it
  const [
    tokenUserName,
    tokenPassword
  ] = authService.parseBasicToken(
    basicToken
  );

  //validate the tokens received for existence
  if (
    !tokenPassword ||
    !tokenUserName
  ) {
    return res.status(401).json({
      error:
        'Unauthorized request: bad token'
    });
  }

  authService
    .getUserWithUserName(
      req.app.get('db'),
      tokenUserName
    )
    .then(user => {
      //validate for existence of user in database and password to match given password
      //user contains name password pair in an array

      if (
        !user ||
        !bcrypt
          .compare(
            tokenPassword,
            user.password
          )
          .then(yesOrNo => yesOrNo)
      ) {
        return res.status(401).json({
          error:
            'Unauthorized request: username and password dont exist'
        });
      }
      console.log(
        'doing the next thing'
      );
      next(); //if everything is fine go to next middleware
    })
    .catch(next); //if everything is bad do
}
module.exports = { requireAuth };
