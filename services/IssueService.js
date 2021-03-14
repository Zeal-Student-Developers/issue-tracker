const Issue = require("../models/Issue");

/**
 * Class for performing CRUD operations on Issues.
 */
class IssueService {
  constructor() {}

  /**
   * Finds all the issues from the database.
   * @returns {Promise<Document[]>} List of all the issues.
   */
  async getAllIssues() {
    try {
      const issues = await Issue.find({
        isInappropriate: false,
        isDeleted: false,
      }).sort("-upvotes");
      return Promise.resolve(issues);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Finds all the issues by the specified department.
   * @param {String} dept Department to get the issues from.
   * @returns {Promise<Document[]>} List of all the issues by specified department.
   */
  async getAllIssuesByDepartment(dept) {
    try {
      const issues = await Issue.find({
        isInappropriate: false,
        isDeleted: false,
        $or: [{ department: dept }, { scope: "INSTITUTE" }],
      }).sort("-upvotes");
      return Promise.resolve(issues);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Finds the issue with specific ID.
   * @param {String} id ID of the issue to find.
   * @returns {Promise<Document>} Issue with the specified ID.
   */
  async getIssueById(id) {
    try {
      const issue = await Issue.findOne({
        _id: id,
        isDeleted: false,
      });
      return Promise.resolve(issue);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Finds issues containing given keywords.
   * @param {String} phrase String containing keywords to find in issues
   * @returns {Promise<Document[]>} List of issues containing given keywords.
   */
  async getAllIssuesByPhrase(phrase) {
    const keywords = phrase.trim().replace(/[\s\n]+/gi, "|");
    const regex = new RegExp(keywords, "gi");
    const issues = await Issue.find({
      $or: [{ title: regex }, { description: regex }],
    });
    return issues;
  }

  /**
   * Creates a new issue & saves into the database.
   * @param {String} title Title of the Issue.
   * @param {String} description Description of the issue.
   * @param {String} section Section to which the issue belongs.
   * @param {String[]} images Paths to images for the issue.
   * @param {String} scope Scope of the issue.
   * @param {String} department Department to which the issue belongs.
   * @param {String} userID userID of the user who created the issue.
   * @returns {Promise<Document>} The newly created Issue.
   */
  async addIssue(
    title,
    description,
    section,
    images,
    department,
    scope,
    userID
  ) {
    try {
      const issue = await Issue.create({
        title: title,
        description: description,
        section: section,
        images: images,
        department: department,
        scope: scope,
        isEdited: false,
        isResolved: false,
        isInappropriate: false,
        upvotes: 0,
        upvoters: [],
        comments: [],
        solutions: [],
        createdBy: userID,
        createdOn: new Date().toLocaleString(),
      });
      return Promise.resolve(issue);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Updates the issue with new values.
   * @param updatedIssue The object with updated issue properties.
   * @returns {Promise<Document>} The updated issue.
   */
  async updateIssue(updatedIssue) {
    try {
      const issue = await Issue.findById(updatedIssue.id);
      if (issue) {
        issue.name = updatedIssue.name || issue.name;
        issue.description = updatedIssue.description || issue.description;
        issue.section = updatedIssue.section || issue.section;
        issue.department = updatedIssue.department || issue.department;
        issue.isEdited = updatedIssue.isEdited || issue.isEdited;
        issue.isResolved = updatedIssue.isResolved || issue.isResolved;
        issue.isInappropriate =
          updatedIssue.isInappropriate || issue.isInappropriate;

        let userID = null;

        if ((userID = updatedIssue.upvoters)) {
          // If user has already upvoted the issue, remove the upvote.
          if (issue.upvoters.includes(userID)) {
            issue.upvotes -= 1;
            issue.upvoters = issue.upvoters.filter((id) => id !== userID);
          } else {
            // Else, add the userID to upvoters list.
            issue.upvotes += 1;
            issue.upvoters.push(userID);
          }
        }

        let comment = null;
        if ((comment = updatedIssue.comments)) {
          issue.comments.push(comment);
        }

        let solution = null;
        if ((solution = updatedIssue.solutions)) {
          issue.solutions.push(solution);
        }
        return Promise.resolve(await issue.save());
      }
      return Promise.resolve(null);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Deletes the issue with specified ID.
   * @param {String} id ID of the issue to be deleted.
   * @returns {Promise<Document>} The deleted issue.
   */
  async deleteIssue(id) {
    try {
      const issue = await Issue.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { runValidators: true, new: true }
      );
      return Promise.resolve(issue);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

module.exports = new IssueService();
