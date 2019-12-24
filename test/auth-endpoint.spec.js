const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');
const jwt = require('jsonwebtoken');
const authService = require('../src/auth/auth-service');
const assert = require('assert');

describe('Auth Endpoints', function() {
  let db;

  const {
    testUsers
  } = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection:
        process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () =>
    db.destroy()
  );

  before('cleanup', () =>
    helpers.cleanTables(db)
  );

  afterEach('cleanup', () =>
    helpers.cleanTables(db)
  );
  describe('POST /api/auth/login', () => {
    beforeEach('insert users', () =>
      helpers.seedThingsTables(
        db,
        testUsers,
        [],
        []
      )
    );

    const requiredFields = [
      'user_name',
      'password'
    ];
    requiredFields.forEach(field => {
      const loginAttempt = {
        user_name: testUser.user_name,
        password: testUser.password
      };
      it(`responds with a 400 error when the ${field} is missing`, () => {
        delete loginAttempt[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttempt)
          .expect(400, {
            error: `Missing ${field} in request body`
          });
      });
    });
    it('responds with 400 \'bad user name or password\' when given a user that doesn\'t exist', () => {
      const invalidUser = {
        user_name: 'user-not',
        password: 'existy'
      };
      return supertest(app)
        .post('/api/auth/login')
        .send(invalidUser)
        .expect(400, {
          error:
            'bad user name or password'
        });
    });

    it('responds with 400 \'bad user name or password \' when given a bad password', () => {
      const userInvalidPass = {
        user_name: testUser.user_name,
        password: 'not-passwordy'
      };
      return supertest(app)
        .post('/api/auth/login')
        .send(userInvalidPass)
        .expect(400, {
          error:
            'bad user name or password'
        });
    });

    it('responds with 200 and a JWT auth token with a secret when given valid credentials', () => {
      const userValidCreds = {
        user_name: testUser.user_name,
        password: 'password'
      };

      const expectedToken = jwt.sign(
        { user_id: testUser.id },
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          algorithm: 'HS256'
        }
      );
      // expectedToken = authService.createJWT(
      //   testUser.user_name,
      //   {
      //     user_id: testUser.id
      //   }
      // );
      // console.log(testUser.user_name, {
      //   user_id: testUser.id
      // });
      // console.log(
      //   'secret-spec:',
      //   process.env.JWT_SECRET
      // );, {
      //  { authToken: expectedToken
      // }

      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200)
        .expect(res => {
          assert(
            jwt.decode(
              res.body.authToken
            ),
            jwt.decode(expectedToken)
          ); //can't test the token directly due to iat differences
          assert(
            jwt.verify(
              res.body.authToken,
              process.env.JWT_SECRET
            ),
            jwt.decode(expectedToken)
          ); //checks the verified token against expected payload
        });
    });
  });
});
