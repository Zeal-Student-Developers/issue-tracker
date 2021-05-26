const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");

const UserService = require("../../../services/UserService");
const User = require("../../../models/User");
const AccessControl = require("accesscontrol");

const {
  authHelper: { hasAccessTo, allowIfLoggedIn },
} = require("../../../misc/helpers");

describe("UserService", () => {
  describe("getAllUsers()", () => {
    let stub;
    beforeEach(() => {
      stub = sinon.stub(User, "find");
    });

    afterEach(() => {
      stub.restore();
    });

    it("resolves to a list of users if User.find resolves", async () => {
      stub.resolves({});

      const users = await UserService.getAllUsers();

      expect(stub.calledOnce).to.be.true;
      expect(users).to.be.deep.equal({});
    });

    it("rejects if User.find rejects and throws an error", async () => {
      stub.rejects(new Error("Some error"));

      try {
        const users = await UserService.getAllUsers();

        expect(users).to.be.undefined;
        expect.fail("It should fail and reject");
      } catch (err) {
        expect(stub.calledOnce).to.be.true;
        expect(err.message).to.be.eql("Some error");
      }
    });
  });

  describe("getUserByUserId()", () => {
    let userStub;

    beforeEach(() => {
      userStub = sinon.stub(User, "findOne");
    });

    afterEach(() => {
      userStub.restore();
    });

    it("resolves if User.findOne resolves with data", async () => {
      userStub.resolves({});
      try {
        const users = await UserService.getUserByUserId(123131);
        expect(userStub.calledOnce).to.be.true;
        expect(users).to.be.empty;
      } catch (err) {
        expect(err).to.be.undefined;
      }
    });

    it("rejects if User.findOne rejects with an error", async () => {
      userStub.rejects(new Error("Some Error"));
      try {
        const users = await UserService.getUserByUserId(12133);
        expect(users).to.be.undefined;
        expect.fail("It should fail and reject");
      } catch (err) {
        expect(userStub.calledOnce).to.be.true;
        expect(err.message).to.be.eql("Some Error");
      }
    });
  });

  describe("createUser()", () => {
    let userStub;
    const userDoc = {
      userId: 1100881,
      role: "admin",
      firstName: "firstName",
      lastName: "lastName",
      department: "department",
      password: "password",
      isDisabled: false,
      refreshToken: "axasda",
    };

    beforeEach(() => {
      userStub = sinon.stub(User, "create");
    });

    afterEach(() => {
      userStub.restore();
    });

    it("fails if a non-number userId is passed to it", async () => {
      try {
        await UserService.createUser(
          "random",
          "firstName",
          "lastName",
          "password",
          "department",
          "role"
        );
      } catch (err) {
        expect(err.message).to.be.eql(
          'User validation failed: userId: Cast to Number failed for value "NaN" at path "userId"'
        );
      }
    });

    it("resolves and returns the same user if user.save() resolves", async () => {
      userStub.resolves(userDoc);

      try {
        const userReturned = await UserService.createUser(
          1100881,
          "firstName",
          "lastName",
          "password",
          "department",
          "role"
        );

        expect(userStub.calledOnce).to.be.true;
        expect(userReturned).to.be.eql(userDoc);
      } catch (err) {
        expect.fail(err);
      }
    });

    it("rejects if user.save() rejects with an error", async () => {
      userStub.rejects(new Error("Some Error"));

      try {
        const userReturned = await UserService.createUser(
          1100881,
          "firstName",
          "lastName",
          "password",
          "department",
          "role"
        );
      } catch (err) {
        expect(err.message).to.be.eql("Some Error");
      }
    });
  });

  describe("deleteUser()", () => {
    let userStub;

    beforeEach(() => {
      userStub = sinon.stub(User, "findOneAndUpdate");
    });

    afterEach(() => {
      userStub.restore();
    });

    it("resolves and returns a user object if User.findOneAndUpdate resolves", async () => {
      userStub.resolves({});

      try {
        const user = await UserService.deleteUser(112313);

        expect(userStub.calledOnce).to.be.true;
        expect(user).to.eql({});
      } catch (err) {
        expect.fail(err);
      }
    });

    it("rejects if User.findOneAndUpdate rejects", async () => {
      userStub.rejects(new Error("Some Error"));

      try {
        const user = await UserService.deleteUser(112313);

        expect.fail("It Should fail and throw an error");
      } catch (err) {
        expect(userStub.calledOnce).to.be.true;
        expect(err.message).to.eql("Some Error");
      }
    });
  });

  describe("deleteAllUsers()", () => {
    let userStub;
    beforeEach(() => {
      userStub = sinon.stub(User, "updateMany");
    });

    afterEach(() => {
      userStub.restore();
    });

    it("resolves and returns the count of deleted users if User.updateMany resolves", async () => {
      userStub.resolves({ nModified: 5 });

      try {
        const deletedCount = await UserService.deleteAllUsers();

        expect(userStub.calledOnce).to.be.true;
        expect(deletedCount).to.eql(5);
      } catch (err) {
        expect.fail(err);
      }
    });

    it("rejects if User.updateMany rejects with an Error", async () => {
      userStub.rejects(new Error("Some Error"));

      try {
        const deletedCount = await UserService.deleteAllUsers();

        expect.fail("It Should fail and throw an error");
      } catch (err) {
        expect(userStub.calledOnce).to.be.true;
        expect(err.message).to.eql("Some Error");
      }
    });
  });

  describe("updateUser()", () => {
    let userStub, stub;
    const userDoc = {
      userId: 1100881,
      role: "admin",
      firstName: "firstName",
      lastName: "lastName",
      department: "department",
      password: "password",
      isDisabled: false,
      refreshToken: "axasda",
    };

    beforeEach(() => {
      userStub = sinon.stub(User.prototype, "save");
      stub = sinon.stub(User, "findOne");
    });

    afterEach(() => {
      userStub.restore();
      stub.restore();
    });

    it("rejects if User.findOne rejects", async () => {
      stub.rejects();

      try {
        const updatedUser = await UserService.updateUser(userDoc);
        expect(updatedUser).to.be.null;
      } catch (err) {
        expect(stub.calledOnce).to.be.true;
        expect(err.message).to.eql("Error");
      }
    });

    it("rejects if User.findOne returns null", async () => {
      stub.resolves(null);

      try {
        const updatedUser = await UserService.updateUser(userDoc);
        expect(updatedUser).to.be.null;
      } catch (err) {
        expect(stub.calledOnce).to.be.true;
      }
    });

    it("resolves and returns the updated user if user.save resolves", async () => {
      stub.resolves({ ...userDoc, save: userStub });
      userStub.resolves(userDoc);

      try {
        const updatedUser = await UserService.updateUser(userDoc);

        expect(stub.calledOnce).to.be.true;
        expect(userStub.calledOnce).to.be.true;
        expect(updatedUser).to.equal(userDoc);
      } catch (err) {
        expect.fail(err);
      }
    });

    it("resolves and returns the same user if parameters passed to newUser are undefined", async () => {
      stub.resolves({ ...userDoc, save: userStub });
      userStub.resolves(userDoc);

      try {
        const updatedUser = await UserService.updateUser({});

        expect(stub.calledOnce).to.be.true;
        expect(userStub.calledOnce).to.be.true;
        expect(updatedUser).to.equal(userDoc);
      } catch (err) {
        expect.fail(err);
      }
    });

    it("rejects if user.save rejects with an error", async () => {
      stub.resolves({ ...userDoc, save: userStub });
      userStub.rejects(new Error("Some error"));

      try {
        const updatedUser = await UserService.updateUser(userDoc);
        expect(updatedUser).to.be.null;
      } catch (err) {
        expect(stub.calledOnce).to.be.true;
        expect(userStub.calledOnce).to.be.true;
      }
    });
  });

  describe("allowIfLoggedIn()", () => {
    let nextSpy;

    beforeEach(() => {
      nextSpy = sinon.spy();
    });

    it("returns an error if res.locals.loggedInUser is undefined", async () => {
      const retval = allowIfLoggedIn(
        {},
        {
          locals: { loggedInUser: undefined },
          status: sinon
            .stub()
            .returns({ json: sinon.stub().returns(new Error("Some Error")) }),
        },
        nextSpy
      );

      expect(nextSpy.callCount).to.eql(0);
      expect(retval.message).to.eql("Some Error");
    });

    it("calls next() without any error if res.locals.loggedInUser is set", async () => {
      allowIfLoggedIn({}, { locals: { loggedInUser: "Some User" } }, nextSpy);

      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.getCall(0).args).to.be.empty;
    });

    it("calls next() with an error passed to it if loggedInUser is not set", async () => {
      allowIfLoggedIn({}, {}, nextSpy);

      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.getCall(0).args[0]).to.exist;
    });
  });

  describe("hasAccessTo()", () => {
    let rolesStub;
    let nextSpy;

    beforeEach(() => {
      rolesStub = sinon.stub(AccessControl.prototype, "can");
      nextSpy = sinon.spy();
    });

    afterEach(() => {
      rolesStub.restore();
    });

    it("calls next() without any error if role has permission granted", async () => {
      rolesStub.returns({ updateOwn: sinon.stub().returns({ granted: true }) });

      await hasAccessTo("updateOwn", "something")(
        { user: { role: "somerole" } },
        {},
        nextSpy
      );

      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.getCall(0).args).to.be.empty;
    });

    it("calls next with an error if role doesn't have permission granted", async () => {
      rolesStub.returns({
        updateOwn: sinon.stub().returns({ granted: false }),
      });

      await hasAccessTo("updateOwn", "something")(
        { user: { role: "somerole" } },
        {},
        nextSpy
      );

      expect(nextSpy.calledOnce).to.be.true;
      expect(nextSpy.getCall(0).args).to.not.be.empty;
    });
  });
});
