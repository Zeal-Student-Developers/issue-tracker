require("./hooks");

const chai = require("chai");
const chaiHttp = require("chai-http");
const { hashSync } = require("bcryptjs");
chai.use(chaiHttp);

const { request, expect } = chai;

const initServer = require("../../loaders");

const { User } = require("../../models");

const { JWT_CSE, JWT_INVALID, JWT_L3 } = require("./keys");

let app = null;
let dbConnection = null;

process.env.NODE_ENV = "test";

describe("user routes Tests", function () {
  this.beforeAll(async function () {
    const { server, connection } = await initServer();
    app = server;
    dbConnection = connection;
  });

  this.afterAll(async function () {
    await dbConnection.close();
  });

  describe("Get own profile route", function () {
    describe("GET /api/users/", function () {
      it("should return 200 on success", function (done) {
        request(app)
          .get("/api/users/")
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("user");
              expect(JSON.stringify(res.body.user)).to.eq(
                JSON.stringify({
                  userId: 1234600,
                  firstName: "Jan",
                  lastName: "O'Kon",
                  department: "CSE",
                })
              );
            }

            done();
          });
      });

      it("should return 403 when JWT is not provided", function (done) {
        request(app)
          .get("/api/users/")
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body).to.haveOwnProperty("error");
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });

      it("should return 403 when user is not found", function (done) {
        request(app)
          .get("/api/users/")
          .set("Authorization", `Bearer ${JWT_INVALID}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body).to.haveOwnProperty("error");

              // This might need to be changed!
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });
    });
  });

  describe("Add single user", function () {
    const user = {
      userId: "1472583",
      firstName: "user",
      lastName: "user",
      password: "123456",
      department: "Mechanical",
      role: "user",
    };

    describe("POST /api/users/add", function () {
      before(async () => {
        await User.findOneAndDelete({ userId: "1472583" });
      });

      it("Should return 200 on success", function (done) {
        request(app)
          .post("/api/users/add")
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(user)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("User added");
            }

            done();
          });
      });

      it("Should return 400 when user already exists", function (done) {
        request(app)
          .post("/api/users/add")
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(user)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("userId already exists");
            }

            done();
          });
      });

      it("Should return 400 when any of the required fields is not provided", function (done) {
        // Here. `role` and `department` are not provided
        request(app)
          .post("/api/users/add")
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send({
            ...user,
            role: undefined,
            department: undefined,
          })
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(JSON.stringify(res.body.error)).to.eq(
                JSON.stringify({
                  department: '"department" is required',
                  role: '"role" is required',
                })
              );
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        request(app)
          .post("/api/users/add")
          .send(user)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });

      it("Should return 401 when user is not auth_level_three", function () {
        request(app)
          .post("/api/users/add")
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(user)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(401);
              expect(res.body.error).to.eq(
                "You are not authorized to perform the action"
              );
            }
          });
      });
    });
  });

  // TODO: Write tests for add users from file

  describe("Update current user's password", function () {
    const route = "/api/users/update/password";

    this.beforeEach(async function () {
      await User.findOneAndUpdate(
        { userId: "1234600" },
        { password: hashSync("123456") }
      );
    });

    describe("PATCH /api/users/update/password", function () {
      it("Should return 200 on success", function (done) {
        const body = {
          oldPassword: "123456",
          newPassword: "111111",
        };

        request(app)
          .patch(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Password updated");
            }

            done();
          });
      });

      it("Should return 400 when password is incorrect", function (done) {
        const body = {
          oldPassword: "123450",
          newPassword: "111111",
        };

        request(app)
          .patch(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("Incorrect password");
            }

            done();
          });
      });

      it("Should return 400 when old password is same as new password", function (done) {
        const body = {
          oldPassword: "123456",
          newPassword: "123456",
        };

        request(app)
          .patch(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq(
                "New password should be different from previous password"
              );
            }

            done();
          });
      });

      it("Should return 400 when new password is not 6 chars", function (done) {
        const body = {
          oldPassword: "123456",
          newPassword: "11111",
        };

        request(app)
          .patch(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(JSON.stringify(res.body.error)).to.eq(
                JSON.stringify({
                  _new: "New password must be atleast 6 characters long",
                })
              );
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const body = {
          oldPassword: "123456",
          newPassword: "111111",
        };

        request(app)
          .patch(route)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });
    });
  });

  describe("Update current user's profile", function () {
    const route = "/api/users/update/profile";

    describe("POST /api/users/update/profile", function () {
      it("Should return 200 on success", function (done) {
        const body = {
          department: "CSE",
        };

        request(app)
          .post(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("User updated");
            }

            done();
          });
      });

      it("Should return 400 when no field is provided", function (done) {
        const body = {};

        request(app)
          .post(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("Please provide some data");
            }

            done();
          });
      });

      it("Should return 400 when all fields provided are empty", function (done) {
        const body = {
          firstName: "",
          lastName: "",
          department: "",
        };

        request(app)
          .post(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("Please provide some data");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const body = {};

        request(app)
          .post(route)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });
    });
  });

  describe("Delete own profile", function () {
    this.afterEach(async function () {
      await User.findOneAndUpdate({ userId: 1234600 }, { isDeleted: false });
    });

    describe("DELETE /api/users/", function () {
      const route = "/api/users";

      it("should return 200 on success", function (done) {
        request(app)
          .delete(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("User deleted");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        request(app)
          .delete(route)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });
    });
  });

  describe("Get all users", function () {
    const route = "/api/users/all";
    describe("GET /api/users/all", function () {
      it("Should return 200 on success", function (done) {
        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("data");
              expect(res.body.data.users).to.be.an("array");
              expect(res.body.data.users.length).to.be.lte(5);
            }

            done();
          });
      });

      it("Should return 401 when user is not auth_level_three/two", function (done) {
        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(401);
              expect(res.body.error).to.eq(
                "You are not authorized to perform the action"
              );
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        request(app)
          .get(route)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });
    });
  });

  describe("Get user by ID", function () {
    const route = "/api/users/";

    describe("GET /api/users/:id", function () {
      it("Should return 200 on success", function (done) {
        const userId = "6098e1b30382a415472ca7b7";

        request(app)
          .get(route + `${userId}`)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(JSON.stringify(res.body.user)).to.eq(
                JSON.stringify({
                  firstName: "Theodore",
                  lastName: "Paucek",
                  department: "ELECTRONICS",
                  role: "user",
                })
              );
            }

            done();
          });
      });

      it("Should return 400 when no user is found", function (done) {
        const userId = "6098e2b30382a415472ca7b7";

        request(app)
          .get(route + `${userId}`)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No user found");
            }

            done();
          });
      });

      it("Should return 400 when userId is not valid", function (done) {
        const userId = "1234567890";

        request(app)
          .get(route + `${userId}`)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("Please provide a valid ID");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const userId = "1234567890";

        request(app)
          .get(route + `${userId}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });

      it("Should return 401 when JWT is not auth_level_three/two", function (done) {
        const userId = "6098e1b30382a415472ca7b7";

        request(app)
          .get(route + `${userId}`)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(401);
              expect(res.body.error).to.eq(
                "You are not authorized to perform the action"
              );
            }

            done();
          });
      });
    });
  });

  describe("Update any user profile", function () {
    const route = "/api/users/update/profile/";

    describe("POST /api/users/update/profile/:id", function () {
      it("Should return 200 on success", function (done) {
        const userId = "6098e1b30382a415472ca7b8";
        const body = {
          department: "CSE",
        };

        request(app)
          .post(route + userId)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
            }

            done();
          });
      });

      it("Should return 400 when no user is found", function (done) {
        const userId = "6098e1b40382a415472ca7b8";
        const body = {
          department: "CSE",
        };

        request(app)
          .post(route + userId)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No user found");
            }

            done();
          });
      });

      it("Should return 400 when userId is invalid", function (done) {
        const userId = "1234567890";
        const body = {
          department: "CSE",
        };

        request(app)
          .post(route + userId)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("Please provide a valid ID");
            }

            done();
          });
      });

      it("Should return 401 when JWT is not auth_level_three/two", function (done) {
        const userId = "1234567890";
        const body = {
          department: "CSE",
        };

        request(app)
          .post(route + userId)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(401);
              expect(res.body.error).to.eq(
                "You are not authorized to perform the action"
              );
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const userId = "1234567890";
        const body = {
          department: "CSE",
        };

        request(app)
          .post(route + userId)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });
    });
  });

  describe("Delete any user profile", function () {
    const route = "/api/users/";

    this.afterEach(async function () {
      await User.findByIdAndUpdate("6098e1b30382a415472ca7b8", {
        isDeleted: false,
      });
    });
    describe("DELETE /api/users/:id", function () {
      it("Should return 200 on success", function (done) {
        const userId = "6098e1b30382a415472ca7b8";

        request(app)
          .delete(route + userId)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("User deleted");
            }

            done();
          });
      });

      it("Should return 400 when no user is found", function (done) {
        const userId = "6098e1c30382a415472ca7b8";

        request(app)
          .delete(route + userId)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No user found");
            }

            done();
          });
      });

      it("Should return 400 when userId is invalid", function (done) {
        const userId = "1234567890";

        request(app)
          .delete(route + userId)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("Please provide a valid ID");
            }

            done();
          });
      });

      it("Should return 401 when JWT is not auth_level_three/two", function (done) {
        const userId = "1234567890";

        request(app)
          .delete(route + userId)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(401);
              expect(res.body.error).to.eq(
                "You are not authorized to perform the action"
              );
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const userId = "1234567890";

        request(app)
          .delete(route + userId)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("You need to be logged in");
            }

            done();
          });
      });
    });
  });
});
