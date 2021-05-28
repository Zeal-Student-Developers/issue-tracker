const chai = require("chai");
const chaiHttp = require("chai-http");
const { describe } = require("mocha");
chai.use(chaiHttp);

const { request, expect } = chai;

const initServer = require("../../loaders");
const { Issue } = require("../../models");

let app = null;
let dbConnection = null;

const { JWT_L3, JWT_CSE, JWT_L1 } = require("./keys");

describe("issue routes Tests", function () {
  this.beforeAll(async function () {
    const { server, connection } = await initServer();
    app = server;
    dbConnection = connection;
  });

  this.afterAll(async function () {
    await dbConnection.close();
  });

  describe("Get all issues", function () {
    const route = "/api/issues/all";

    describe(`GET ${route}`, function () {
      it("Should return 200 on success with default page limit", function (done) {
        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("data");
              expect(res.body.data).to.haveOwnProperty("issues");
              expect(res.body.data.issues.length).to.be.lte(5);
            }

            done();
          });
      });

      it("Should return 200 on success with page limit 10", function (done) {
        request(app)
          .get(`${route}?limit=10`)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("data");
              expect(res.body.data).to.haveOwnProperty("issues");
              expect(res.body.data.issues).to.have.length.lte(10);
            }

            done();
          });
      });

      it("Should only return issues with department CSE for general user", function (done) {
        request(app)
          .get(`${route}`)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("data");
              expect(res.body.data).to.haveOwnProperty("issues");
              res.body.data.issues.forEach(({ department, scope }) => {
                if (scope !== "ORGANIZATION") expect(department).to.eq("CSE");
              });
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

  describe("Get issues created by current user", function () {
    const route = "/api/issues/own";

    describe(`GET ${route}`, function () {
      it("Should return 200 on success", function (done) {
        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              res.body.data.issues.forEach(({ isAuthor }) => {
                expect(isAuthor).to.be.true;
              });
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

  describe("Get issue by resolve status", function () {
    const route = "/api/issues/status?resolved=";

    describe(`GET ${route}true`, function () {
      it("Should return 200 on success", function (done) {
        request(app)
          .get(`${route}true`)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.data.issues.length).to.be.lte(5);
              res.body.data.issues.forEach(({ isResolved }) => {
                expect(isResolved).to.be.true;
              });
            }

            done();
          });
      });

      it("Should return 400 when JWT is not provided", function (done) {
        request(app)
          .get(`${route}true`)
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

      it("Should only return issues of user's department", function (done) {
        request(app)
          .get(`${route}true`)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.data.issues.length).to.be.lte(5);
              res.body.data.issues.forEach(({ scope, department }) => {
                if (scope !== "ORGANIZATION") expect(department).to.eq("CSE");
              });
            }

            done();
          });
      });
    });

    describe(`GET ${route}false`, function () {
      it("Should return 200 on success", function (done) {
        request(app)
          .get(`${route}false`)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.data.issues.length).to.be.lte(5);
              res.body.data.issues.forEach(({ isResolved }) => {
                expect(isResolved).to.be.false;
              });
            }

            done();
          });
      });

      it("Should return 400 when JWT is not provided", function (done) {
        request(app)
          .get(`${route}false`)
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

      it("Should only return issues of user's department", function (done) {
        request(app)
          .get(`${route}?resolved=false`)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.data.issues.length).to.be.lte(5);
              res.body.data.issues.forEach(
                ({ isResolved, scope, department }) => {
                  expect(isResolved).to.be.false;
                  if (scope !== "ORGANIZATION") expect(department === "CSE");
                }
              );
            }

            done();
          });
      });
    });
  });

  describe("Get issue by phrase", function () {
    const route = "/api/issues/phrase?phrase=";

    describe(`GET ${route}loan amount`, function () {
      it("Should return 200 on success", function (done) {
        request(app)
          .get(`${route}loan amount`)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
            }

            done();
          });
      });

      it("Should return 400 when JWT is not provided", function (done) {
        request(app)
          .get(`${route}loan amount`)
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

      it("Should only return issues of user's department", function (done) {
        request(app)
          .get(`${route}loan amount`)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.data.issues.length).to.lte(5);
              res.body.data.issues.forEach(({ scope, department }) => {
                if (scope !== "ORGANIZATION") expect(department).to.eq("CSE");
              });
            }

            done();
          });
      });
    });
  });

  describe("Get issue by Id", function () {
    const route = "/api/issues/";

    describe(`GET ${route}60a4c3004b120e716d9c81be`, function () {
      it("Should return 200 on success", function (done) {
        const issueId = "60a4c3004b120e716d9c81be";

        request(app)
          .get(route + issueId)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("issue");
            }

            done();
          });
      });

      it("Should return 200 for issue scope is ORGANIZATION", function (done) {
        const issueId = "60a4c3004b120e716d9c81c6";

        request(app)
          .get(route + issueId)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("issue");
            }

            done();
          });
      });

      it("Should return 400 when issue is not found", function (done) {
        const issueId = "60a4c4004b120e716d9c81be";

        request(app)
          .get(route + issueId)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 403 when user is not auth_level_three/two, issue scope is not ORGANIZATION & issue belongs to different department", function (done) {
        const issueId = "60a4c3004b120e716d9c81be";

        request(app)
          .get(route + issueId)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const issueId = "60a4c3004b120e716d9c81be";

        request(app)
          .get(route + issueId)
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

  describe("Get comments", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/comments`;

    describe(`GET ${getRoute("60a4c3004b120e716d9c81be")}`, function () {
      it("Should return 200 on success", function (done) {
        const route = getRoute("60a4c3004b120e716d9c81be");

        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("data");
              expect(res.body.data).to.haveOwnProperty("comments");
              expect(res.body.data.comments).to.be.an("array");
              expect(res.body.data.comments.length).to.be.lte(5);
            }

            done();
          });
      });

      it("Should return 200 when issue scope is ORGANIZATION", function (done) {
        const route = getRoute("60a4c3004b120e716d9c81c6");

        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("data");
              expect(res.body.data).to.haveOwnProperty("comments");
              expect(res.body.data.comments).to.be.an("array");
              expect(res.body.data.comments.length).to.be.lte(5);
            }

            done();
          });
      });

      it("Should return 403 when issue belongs to different department", function (done) {
        const route = getRoute("60a4c3004b120e716d9c81be");

        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });

      it("Should return 400 when issue is not found", function (done) {
        const route = getRoute("60a4c3004b120e516d9c81be");

        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const route = getRoute("60a4c3004b120e516d9c81be");

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

  describe("Get solutions", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/solutions`;

    describe(`GET ${getRoute("60a4c3004b120e716d9c81be")}`, function () {
      it("Should return 200 on success", function (done) {
        const route = getRoute("60a4c3004b120e716d9c81be");

        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("data");
              expect(res.body.data).to.haveOwnProperty("solutions");
              expect(res.body.data.solutions).to.be.an("array");
              expect(res.body.data.solutions.length).to.be.lte(5);
            }

            done();
          });
      });

      it("Should return 200 when issue scope is ORGANIZATION", function (done) {
        const route = getRoute("60a4c3004b120e716d9c81c6");

        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body).to.haveOwnProperty("data");
              expect(res.body.data).to.haveOwnProperty("solutions");
              expect(res.body.data.solutions).to.be.an("array");
              expect(res.body.data.solutions.length).to.be.lte(5);
            }

            done();
          });
      });

      it("Should return 403 when issue belongs to different department", function (done) {
        const route = getRoute("60a4c3004b120e716d9c81be");

        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });

      it("Should return 400 when issue is not found", function (done) {
        const route = getRoute("60a4c3004b120e516d9c81be");

        request(app)
          .get(route)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const route = getRoute("60a4c3004b120e516d9c81be");

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

  //! Remove the skips on 2 test cases before running! Skipped as they
  //! required Azure API access
  describe("Add issue", function () {
    const route = "/api/issues/";

    describe(`POST ${route}`, function () {
      it("Should return 200 on success", function (done) {
        const body = {
          title: "title",
          description: "description",
          section: "issue section",
          scope: "DEPARTMENT",
          images: [],
        };

        request(app)
          .post(route)
          .send(body)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              console.log(res.body);
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Issue created");
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

      it("Should return 400 when title/description is not provided", function (done) {
        const body = {
          title: "",
          description: "",
          section: "issue section",
          scope: "ORGANIZATION",
          images: [],
        };

        request(app)
          .post(route)
          .send(body)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(JSON.stringify(res.body.error)).to.eq(
                JSON.stringify({
                  title: '"title" is not allowed to be empty',
                  description: '"description" is not allowed to be empty',
                })
              );
            }

            done();
          });
      });

      it("Should return 400 when scope is invalid", function (done) {
        const body = {
          title: "title",
          description: "description",
          section: "issue section",
          scope: "scope",
          images: [],
        };

        request(app)
          .post(route)
          .send(body)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(JSON.stringify(res.body.error)).to.eq(
                JSON.stringify({
                  scope: "Scope must be either 'ORGANIZATION' or 'DEPARTMENT'",
                })
              );
            }

            done();
          });
      });

      it("Should return 403 when issue contains NSFW content", function (done) {
        const body = {
          title: "fucking shit",
          description: "this is bullshit",
          section: "issue section",
          scope: "DEPARTMENT",
          images: [],
        };

        request(app)
          .post(route)
          .send(body)
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              console.log(res.body);
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq(
                "Your post goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
              );
            }

            done();
          });
      });
    });
  });

  describe("Update issue", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/update`;

    after(async function () {
      await Issue.findByIdAndUpdate("60a4c3004b120e716d9c8216", {
        isInappropriate: false,
      });
    });

    describe(`PUT ${getRoute("60a4c3004b120e716d9c8216")}`, function () {
      it("Should return 200 on success", function (done) {
        const body = {
          description: "new description",
        };

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Issue updated");
            }

            done();
          });
      });

      it("Should return 403 when user is not author of issue", function (done) {
        const body = {
          description: "new description",
        };

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });

      it("Should return 400 when user no data is provided", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
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

      it("Should return 400 when no issue is found", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e717d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 403 when data contains NSFW content", function (done) {
        const body = {
          description: "This is shit",
        };

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq(
                "Your post goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
              );
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
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

  describe("Toggle issue resolved status", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/resolve`;

    describe(`PUT ${getRoute("60a4c3004b120e716d9c8216")}`, function () {
      it("Should return 200 with resolved as true", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Issue marked as resolved");
            }

            done();
          });
      });

      it("Should return 200 with resolved as false", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Issue marked as unresolved");
            }

            done();
          });
      });

      it("Should return 400 when no issue is found", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e717d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 403 with user is not author of the issue", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_L3}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
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

  describe("Toggle issue upvote", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/upvote`;

    describe(`PUT ${getRoute("60a4c3004b120e716d9c8216")}`, function () {
      it("Should return 200 with upvote", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Issue upvoted");
            }

            done();
          });
      });

      it("Should return 200 with with upvote removed", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Upvote removed from issue");
            }

            done();
          });
      });

      it("Should return 400 when no issue is found", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e717d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
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

      it("Should return 403 when issue is of different department", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c81be"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });
    });
  });

  describe("Toggle issue inappropriate", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/inappropriate`;

    after(async function () {
      await Issue.findByIdAndUpdate("60a4c3004b120e716d9c8216", {
        isInappropriate: false,
      });
    });

    describe(`PUT ${getRoute("60a4c3004b120e716d9c8216")}`, function () {
      it("Should return 200 with issue marked as inappropriate", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Issue marked as inappropriate");
            }

            done();
          });
      });

      it("Should return 200 with with inappropriate mark removed", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq(
                "Inappropriate mark for the issue removed"
              );
            }

            done();
          });
      });

      it("Should return 400 when no issue is found", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e717d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 403 when JWT is not provided", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
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

      it("Should return 403 when issue is of different department", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c81be"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });
    });
  });

  describe("Post comment", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/comments`;

    describe(`PUT ${getRoute("60a4c3004b120e716d9c8216")}`, function () {
      it("Should return 200 on success", function (done) {
        const body = {
          comment: "A new comment",
        };

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Comment posted");
            }

            done();
          });
      });

      it("Should return 400 when no issue is found", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e717d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 400 when request body is empty", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("Please provide a valid comment");
            }

            done();
          });
      });

      it("Should return 403 when issue is of different department", function (done) {
        request(app)
          .put(getRoute("60a4c3004b120e716d9c81be"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });

      it("Should return 403 when comment has NSFW content", function (done) {
        const body = {
          comment: "Fucking Shit",
        };

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq(
                "Your comment goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
              );
            }

            done();
          });
      });
    });
  });

  describe("Post solution", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/solutions`;

    describe(`PUT ${getRoute("60a4c3004b120e716d9c8216")}`, function () {
      it("Should return 200 on success", function (done) {
        const body = {
          solution: "A new solution",
        };

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Solution posted");
            }

            done();
          });
      });

      it("Should return 400 when no issue is found", function (done) {
        const body = {
          solution: "A new solution",
        };

        request(app)
          .put(getRoute("60a4c3014b120e717d9c8216"))
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 400 when request body is empty", function (done) {
        const body = {};

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("Please provide a valid solution");
            }

            done();
          });
      });

      it("Should return 403 when solution has NSFW content", function (done) {
        const body = {
          solution: "Fucking Shit",
        };

        request(app)
          .put(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_L3}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq(
                "Your comment goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
              );
            }

            done();
          });
      });

      it("Should return 403 when user is not authorized", function (done) {
        const body = {
          solution: "Fucking Shit",
        };

        request(app)
          .put(getRoute("60a4c3004b120e716d9c81c3"))
          .set("Authorization", `Bearer ${JWT_L1}`)
          .send(body)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });
    });
  });

  describe("Delete issues", function () {
    const getRoute = (issueId) => `/api/issues/${issueId}/`;

    describe(`DELETE ${getRoute("60a4c3004b120e716d9c8216")}`, function () {
      it("Should return 200 on success", function (done) {
        request(app)
          .delete(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(200);
              expect(res.body.message).to.eq("Issue deleted");
            }

            done();
          });
      });

      it("Should return 400 when no issue is found", function (done) {
        request(app)
          .delete(getRoute("60a4c3004b120e716d9c8216"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(400);
              expect(res.body.error).to.eq("No issue found");
            }

            done();
          });
      });

      it("Should return 403 when user is not author", function (done) {
        request(app)
          .delete(getRoute("60a4c3004b120e716d9c81be"))
          .set("Authorization", `Bearer ${JWT_CSE}`)
          .end(function (error, res) {
            if (error) {
              expect.fail(`Failed: ${error.message}`);
            } else {
              expect(res).to.have.status(403);
              expect(res.body.error).to.eq("Action not allowed");
            }

            done();
          });
      });
    });
  });
});
