const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Auth Endpoints', function() {
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
        user_name: testUser,
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
  });
});
