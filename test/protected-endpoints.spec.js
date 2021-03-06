const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Protected Endpoints', function() {
  let db;

  const {
    testUsers,
    testThings,
    testReviews
  } = helpers.makeThingsFixtures();

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

  describe('protected Endpoints -- unauthorized', () => {
    //need to make a thing array in the database
    describe('GET/api/things/:thing_id', () => {
      it('responds with a 401 and sends error: missing token', () => {
        return supertest(app)
          .get('/api/things/2')
          .expect(401, {
            error:
              'Missing bearer token'
          });
      });
      it.skip('responds with 401 and unauthorized request when token doesnt have credentials', () => {
        const badToken = {
          user_name: '',
          password: ''
        };
        return supertest(app)
          .get('/api/things/2')
          .set(
            'Authorization',
            helpers.makeAuthHeader(
              badToken
            )
          )
          .expect(401, {
            error:
              'Unauthorized request: bad token'
          });
      });
    });
  });

  describe('GET /api/things/:thing_id', () => {
    context('Given no things', () => {
      beforeEach('add users', () => {
        helpers.seedThingsTables(
          db,
          testUsers,
          [],
          []
        );
      });

      it.skip('responds with 404', () => {
        const thingId = 123456;
        return supertest(app)
          .get(`/api/things/${thingId}`)
          .set(
            'Authorization',
            helpers.makeAuthHeader(
              testUsers[0]
            )
          )
          .expect(404, {
            error: 'Thing doesn\'t exist'
          });
      });
    });

    context(
      'Given there are things in the database',
      () => {
        beforeEach(
          'insert things',
          () =>
            helpers.seedThingsTables(
              db,
              testUsers,
              testThings,
              testReviews
            )
        );

        it.skip('responds with 200 and the specified thing', () => {
          const thingId = 2;
          const expectedThing = helpers.makeExpectedThing(
            testUsers,
            testThings[thingId - 1],
            testReviews
          );

          return supertest(app)
            .get(
              `/api/things/${thingId}`
            )
            .set(
              'Authorization',
              helpers.makeAuthHeader(
                testUsers[0]
              )
            )
            .expect(200, expectedThing);
        });
      }
    );

    context(
      'Given an XSS attack thing',
      () => {
        const testUser = helpers.makeUsersArray()[1];
        const {
          maliciousThing,
          expectedThing
        } = helpers.makeMaliciousThing(
          testUser
        );

        beforeEach(
          'insert malicious thing',
          () => {
            return helpers.seedMaliciousThing(
              db,
              testUser,
              maliciousThing
            );
          }
        );

        it.skip('removes XSS attack content', () => {
          return supertest(app)
            .get(
              `/api/things/${maliciousThing.id}`
            )
            .set(
              'Authorization',
              helpers.makeAuthHeader(
                testUsers[0]
              )
            )
            .expect(200)
            .expect(res => {
              expect(
                res.body.title
              ).to.eql(
                expectedThing.title
              );
              expect(
                res.body.content
              ).to.eql(
                expectedThing.content
              );
            });
        });
      }
    );
  });

  describe('GET /api/things/:thing_id/reviews', () => {
    context('Given no things', () => {
      it.skip('responds with 404', () => {
        const thingId = 123456;
        return supertest(app)
          .get(
            `/api/things/${thingId}/reviews`
          )
          .set(
            'Authorization',
            helpers.makeAuthHeader(
              testUsers[0]
            )
          )
          .expect(404, {
            error: 'Thing doesn\'t exist'
          });
      });
    });

    context(
      'Given there are reviews for thing in the database',
      () => {
        beforeEach(
          'insert things',
          () =>
            helpers.seedThingsTables(
              db,
              testUsers,
              testThings,
              testReviews
            )
        );

        it.skip('responds with 200 and the specified reviews', () => {
          const thingId = 1;
          const expectedReviews = helpers.makeExpectedThingReviews(
            testUsers,
            thingId,
            testReviews
          );

          return supertest(app)
            .get(
              `/api/things/${thingId}/reviews`
            )
            .set(
              'Authorization',
              helpers.makeAuthHeader(
                testUsers[0]
              )
            )
            .expect(
              200,
              expectedReviews
            );
        });
      }
    );
  });
});
