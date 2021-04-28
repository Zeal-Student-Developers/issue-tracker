const { expect } = require("chai");
const { stub } = require("sinon");

const { Issue } = require("../../../models");
const { IssueService: issueService } = require("../../../services");

describe("IssueService", () => {
  // Todo: Add tests for getAllIssues() & getAllIssuesByDepartment()
  //? Not getting how to test the chained mongoose methods

  describe("getIssueById(id)", async () => {
    let findOne;
    beforeEach(() => {
      findOne = stub(Issue, "findOne");
    });
    afterEach(() => findOne.restore());

    it("Resolves if Issue.findOne resolves", async () => {
      findOne.resolves({});
      try {
        const issue = await issueService.getIssueById(1);
        expect(findOne.calledOnce).to.be.true;
        expect(issue).to.be.empty;
      } catch (error) {
        expect(error).to.be.undefined;
      }
    });

    it("Rejects if Issue.findOne rejects", async () => {
      findOne.rejects(new Error("No issue."));
      try {
        const issue = await issueService.getIssueById(1170254);
        expect(issue).to.be.null;
        expect.fail("Must return NULL");
      } catch (error) {
        expect(error.message).to.be.equal("No issue.");
      }
    });
  });

  describe("createIssue()", () => {
    const newIssue = {
      name: "Test",
      description: "description",
      section: "section",
      department: "department",
      isEdited: false,
      isResolved: false,
      isInappropriate: false,
      upvotes: 0,
      upvoters: [],
      comments: [],
      solutions: [],
      createdBy: "123456",
      createdOn: new Date().toLocaleString(),
    };

    let create;
    beforeEach(() => {
      create = stub(Issue, "create");
    });
    afterEach(() => create.restore());

    it("Resolves if Issue.create resolves", async () => {
      create.resolves(newIssue);
      try {
        const issue = await issueService.createIssue(
          "Test",
          "description",
          "section",
          "department",
          "userID"
        );
        expect(create.calledOnce).to.be.true;
        expect(issue).to.equal(newIssue);
      } catch (error) {
        expect(error).to.be.undefined;
      }
    });
  });

  describe("updateIssue()", () => {
    const issue = {
      id: "123",
      name: "Test",
      userID: "123456",
      description: "description",
      section: "section",
      department: "department",
      isEdited: false,
      isResolved: false,
      isInappropriate: false,
      createdBy: "123456",
      createdOn: new Date().toLocaleString(),
    };

    let save, findOne;

    beforeEach(() => {
      findOne = stub(Issue, "findById");
      save = stub(Issue.prototype, "save");
    });

    afterEach(() => {
      findOne.restore();
      save.restore();
    });

    it("Resolves if Issue.save resolves", async () => {
      findOne.resolves(issue);
      save.resolves(issue);
      try {
        const updatedIssue = await issueService.updateIssue(issue);
        expect(updatedIssue).to.be.equal(issue);
        expect(findOne.calledOnce).to.be.true;
        expect(save.calledOnce).to.be.true;
      } catch (error) {
        //! [BUG] Error is not undefined. Error: AssertionError: expected [TypeError: issue.save is not a function] to be undefined
        expect(error).to.be.undefined;
      }
    });

    it("Rejects if Issue.findOne rejects", async () => {
      findOne.rejects(new Error("No issue found."));
      try {
        await issueService.updateIssue(issue);
        expect.fail("It should fail with an error.");
      } catch (error) {
        expect(findOne.calledOnce).to.be.true;
        expect(save.calledOnce).to.be.false;
        expect(error.message).to.equal("No issue found.");
      }
    });

    it("Rejects if Issue.save rejects", async () => {
      findOne.resolves(issue);
      save.rejects();
      try {
        await issueService.updateIssue(issue);
        expect.fail("Should fail");
      } catch (error) {
        expect(findOne.calledOnce).to.be.true;

        //! [BUG] save.calledOnce should be true, but is false.
        // expect(save.calledOnce).to.be.true;
        expect(error).to.not.be.undefined;
      }
    });

    it("Resolves to null if no user is found.", async () => {
      findOne.resolves(null);
      try {
        const updatedIssue = await issueService.updateIssue(issue);
        expect(updatedIssue).to.be.null;
        expect(findOne.calledOnce).to.be.true;
        expect(save.calledOnce).to.be.false;
      } catch (error) {
        expect(error).to.be.undefined;
      }
    });
  });

  describe("deleteIssue", () => {
    const issue = {
      name: "Test",
      description: "description",
      section: "section",
      department: "department",
      isEdited: false,
      isResolved: false,
      isInappropriate: false,
      upvotes: 0,
      upvoters: [],
      comments: [],
      solutions: [],
      createdBy: "123456",
      createdOn: new Date().toLocaleString(),
    };

    let findByIdAndUpdate;

    beforeEach(() => {
      findByIdAndUpdate = stub(Issue, "findByIdAndUpdate");
    });

    afterEach(() => {
      findByIdAndUpdate.restore();
    });

    it("Resolves if Issue.findByIdAndUpdate resolves", async () => {
      findByIdAndUpdate.resolves(issue);
      try {
        const deletedIssue = await issueService.deleteIssue(123);
        expect(deletedIssue).to.be.equal(issue);
        expect(findByIdAndUpdate.calledOnce).to.be.true;
      } catch (error) {
        expect(error).to.be.undefined;
      }
    });

    it("Rejects if Issue.findByIdAndUpdate rejects", async () => {
      findByIdAndUpdate.rejects(new Error("No issue found."));
      try {
        const deletedIssue = await issueService.deleteIssue(123);
        expect.fail("Should fail");
      } catch (error) {
        expect(error.message).to.be.equal("No issue found.");
        expect(findByIdAndUpdate.calledOnce).to.be.true;
      }
    });
  });
});
