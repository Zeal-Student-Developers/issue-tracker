require("./hooks");

const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const { request, expect } = chai;

const initServer = require("../../loaders");

let app = null;
let dbConnection = null;

const { JWT_L1, RESFRESH_TOKEN_L1 } = require("./keys");

describe("authRoute Tests", function () {
  this.beforeAll(async function () {
    const { server, connection } = await initServer();
    app = server;
    dbConnection = connection;
  });

  this.afterAll(async function () {
    await dbConnection.close();
  });

  describe("POST /api/auth/login", function () {
    it("should return 200 on successful login", function (done) {
      request(app)
        .post("/api/auth/login")
        .send({
          userId: "1234560",
          password: "123456",
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(200);
            expect(res.body.token).to.not.be.undefined;
          }

          done();
        });
    });

    it("should return 403 on incorrect password", function (done) {
      request(app)
        .post("/api/auth/login")
        .send({
          userId: "1234560",
          password: "123457",
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(403);
            expect(res.body).to.haveOwnProperty("error");
            expect(res.body.error).to.eq("Password incorrect");
          }

          done();
        });
    });

    it("should return 400 on non-existent userId", function (done) {
      request(app)
        .post("/api/auth/login")
        .send({
          userId: "1234550",
          password: "123457",
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(400);
            expect(res.body).to.haveOwnProperty("error");
            expect(res.body.error).to.eq("No user found");
          }

          done();
        });
    });

    it("should return 400 when userId is not 7 chars", function (done) {
      request(app)
        .post("/api/auth/login")
        .send({
          userId: "123456",
          password: "123457",
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(400);
            expect(res.body).to.haveOwnProperty("error");
            expect(JSON.stringify(res.body.error)).to.eq(
              JSON.stringify({
                userId: '"userId" length must be 7 characters long',
              })
            );
          }

          done();
        });
    });

    it("should return 400 when password is less than 6 chars", function (done) {
      request(app)
        .post("/api/auth/login")
        .send({
          userId: "1234560",
          password: "12345",
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(400);
            expect(res.body).to.haveOwnProperty("error");
            expect(JSON.stringify(res.body.error)).to.eq(
              JSON.stringify({
                password: "Password must be atleast 6 characters long",
              })
            );
          }

          done();
        });
    });

    it("should return 400 when userId is not provided", function (done) {
      request(app)
        .post("/api/auth/login")
        .send({
          password: "12345",
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(400);
            expect(res.body).to.haveOwnProperty("error");
            expect(JSON.stringify(res.body.error)).to.eq(
              JSON.stringify({ userId: '"userId" is required' })
            );
          }

          done();
        });
    });

    it("should return 400 when password is not provided", function (done) {
      request(app)
        .post("/api/auth/login")
        .send({
          userId: "1234560",
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(400);
            expect(res.body).to.haveOwnProperty("error");
            expect(JSON.stringify(res.body.error)).to.eq(
              JSON.stringify({ password: '"password" is required' })
            );
          }

          done();
        });
    });
  });

  describe("POST /api/auth/refresh", function () {
    it("should return 200 on successful refresh of token", function (done) {
      request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${JWT_L1}`)
        .send({
          refreshToken: RESFRESH_TOKEN_L1,
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(200);
            expect(res.body).to.haveOwnProperty("token");
          }

          done();
        });
    });

    it("should return 403 on when refreshToken is not same", function (done) {
      request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${JWT_L1}`)
        .send({
          refreshToken: "asasad",
        })
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(403);
            expect(res.body).to.haveOwnProperty("error");
            expect(res.body.error).to.eq("Invalid refresh token");
          }

          done();
        });
    });

    it("should return 403 when refreshToken is not provided", function (done) {
      request(app)
        .post("/api/auth/refresh")
        .set("Authorization", `Bearer ${JWT_L1}`)
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(403);
            expect(res.body).to.haveOwnProperty("error");
            expect(res.body.error).to.eq("Invalid refresh token");
          }

          done();
        });
    });

    it("should return 403 when JWT is not provided", function (done) {
      request(app)
        .post("/api/auth/refresh")
        .send("refreshToken", RESFRESH_TOKEN_L1)
        .end(function (error, res) {
          if (error) {
            expect.fail(`Failed: ${error.message}`);
          } else {
            expect(res).to.have.status(403);
            expect(res.body).to.haveOwnProperty("error");
            expect(res.body.error).to.eq(
              "Authorization header must contain a valid JWT token"
            );
          }

          done();
        });
    });
  });
});
