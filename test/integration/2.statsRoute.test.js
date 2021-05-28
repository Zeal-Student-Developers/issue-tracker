require("./hooks");

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const { request, expect } = chai;

const initServer = require("../../loaders");
const { JWT_L1, JWT_L3 } = require("./keys");

let app = null;
let dbConnection = null;

describe("stats route Tests", function () {
  this.beforeAll(async function () {
    const { server, connection } = await initServer();
    app = server;
    dbConnection = connection;
  });

  this.afterAll(async function () {
    await dbConnection.close();
  });

  describe("GET /api/stats/issues", function () {
    it("should return 200 on successful response", function (done) {
      request(app)
        .get("/api/stats/issues")
        .set("Authorization", `Bearer ${JWT_L3}`)
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(200);
            expect(res.body).to.haveOwnProperty("stats");
          }

          done();
        });
    });

    it("should return 401 when user accessing stats is not auth_level_three", function (done) {
      request(app)
        .get("/api/stats/issues")
        .set("Authorization", `Bearer ${JWT_L1}`)
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(401);
            expect(res.body).to.haveOwnProperty("error");
            expect(res.body.error).to.eq(
              "You are not authorized to perform the action"
            );
          }

          done();
        });
    });
  });

  describe("GET /api/stats/authority", function () {
    it("should return 200 on successful response", function (done) {
      request(app)
        .get("/api/stats/authority")
        .set("Authorization", `Bearer ${JWT_L3}`)
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(200);
            expect(res.body).to.haveOwnProperty("stats");
          }

          done();
        });
    });

    it("should return 401 when user accessing stats is not auth_level_three", function (done) {
      request(app)
        .get("/api/stats/authority")
        .set("Authorization", `Bearer ${JWT_L1}`)
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(401);
            expect(res.body).to.haveOwnProperty("error");
            expect(res.body.error).to.eq(
              "You are not authorized to perform the action"
            );
          }

          done();
        });
    });
  });
});
