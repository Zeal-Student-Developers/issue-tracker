const Issue = require("../models/Issue");

/**
 * Class for performing CRUD operations on Issues.
 */
class IssueService {
  constructor() {}

  /**
   * Finds all the issues from the database.
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of all the issues.
   */
  static async getAllIssues(page = 0, limit = 10) {
    return await Issue.find({
      isInappropriate: false,
      isDeleted: false,
    })
      .sort("-upvotes")
      .skip(page * limit)
      /* Twice the limit so as to check if more elemenst are available for
        next fetch */
      .limit(2 * limit);
  }

  /**
   * Finds all the issues from the database by their resolve status.
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of all the issues.
   */
  static async getAllIssuesByResolveStatus(
    isResolved = false,
    page = 0,
    limit = 10
  ) {
    return await Issue.find({
      isResolved,
      isInappropriate: false,
      isDeleted: false,
    })
      .skip(page * limit)
      /* Twice the limit so as to check if more elemenst are available for
        next fetch */
      .limit(2 * limit);
  }

  /**
   * Finds all the issues by the specified department.
   * @param {String} dept Department to get the issues from.
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of all the issues by specified department.
   */
  static async getAllIssuesByDepartment(dept, page = 0, limit = 10) {
    return await Issue.find({
      isInappropriate: false,
      isDeleted: false,
      $or: [{ department: dept }, { scope: "ORGANIZATION" }],
    })
      .sort("-upvotes")
      .skip(page * limit)
      .limit(2 * limit);
  }

  /**
   * Finds all the issues by the specified department and resolve status.
   * @param {String} dept Department to get the issues from.
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of all the issues by specified department.
   */
  static async getAllIssuesByDepartmentAndResolveStatus(
    dept,
    isResolved = false,
    page = 0,
    limit = 10
  ) {
    return await Issue.find({
      $or: [{ department: dept }, { scope: "ORGANIZATION" }],
      isResolved,
      isInappropriate: false,
      isDeleted: false,
    })
      .sort("-upvotes")
      .skip(page * limit)
      .limit(2 * limit);
  }

  /**
   * Finds the issue with specific ID.
   * @param {String} id ID of the issue to find.
   * @returns {Promise<Document>} Issue with the specified ID.
   */
  static async getIssueById(id) {
    return await Issue.findOne({
      _id: id,
      isInappropriate: false,
      isDeleted: false,
    });
  }

  /**
   * Finds the issue created by specified user.
   * @param {String} id ID of the user.
   * @returns {Promise<Document[]>} Issue created by the specified user.
   */
  static async getIssuesByUserId(id, page = 0, limit = 10) {
    return await Issue.find({
      createdBy: id,
      isInappropriate: false,
      isDeleted: false,
    })
      .skip(page * limit)
      .limit(2 * limit);
  }

  /**
   * Finds issues containing given keywords.
   * @param {String} phrase String containing keywords to find in issues
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of issues containing given keywords.
   */
  static async getAllIssuesByPhrase(phrase, page = 0, limit = 10) {
    const keywords = phrase.trim().replace(/[\s\n]+/gi, "|");
    const regex = new RegExp(keywords, "gi");
    const issues = await Issue.find({
      $or: [{ title: regex }, { description: regex }],
    })
      .skip(page * limit)
      .limit(2 * limit);

    return issues;
  }

  /**
   * Finds department level issues containing given keywords.
   * @param {String} phrase String containing keywords to find in issues
   * @param {String} department Department of issues to search
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of issues containing given keywords.
   */
  static async getAllIssuesByPhraseAndDepartment(
    phrase,
    department,
    page = 0,
    limit = 10
  ) {
    const keywords = phrase.trim().replace(/[\s\n]+/gi, "|");
    const regex = new RegExp(keywords, "gi");
    const issues = await Issue.find({
      $and: [
        { $or: [{ title: regex }, { description: regex }] },
        { $or: [{ department }, { scope: "ORGANIZATION" }] },
      ],
    })
      .skip(page * limit)
      .limit(2 * limit);

    return issues;
  }

  /**
   * Get all comments for the issue.
   * @param {String} id Id of the issue
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of issues containing given keywords.
   */
  static async getComments(id, page = 0, limit = 10) {
    const start = page * limit;
    const end = start + 2 * limit;

    const issue = await Issue.findById(id, {
      comments: 1,
      department: 1,
      scope: 1,
    });

    if (!issue) return null;

    issue.comments = issue.comments
      .filter(({ isInappropriate }) => !isInappropriate)
      .slice(start, end);

    return issue;
  }

  /**
   * Get all solutions for the issue.
   * @param {String} id Id of the issue
   * @param {Number} page Page number of the search result, used as offset
   * from the beginning of the database
   * @param {Number} limit Limit of number of search elements returned at a
   * time
   * @returns {Promise<Document[]>} List of issues containing given keywords.
   */
  static async getSolutions(id, page = 0, limit = 10) {
    const start = page * limit;
    const end = start + 2 * limit;

    const issue = await Issue.findById(id, {
      solutions: 1,
      department: 1,
      scope: 1,
    });

    if (!issue) return null;

    issue.solutions = issue.solutions
      .filter(({ isInappropriate }) => !isInappropriate)
      .slice(start, end);

    return issue;
  }

  /**
   * Creates a new issue & saves into the database.
   * @param {String} title Title of the Issue.
   * @param {String} description Description of the issue.
   * @param {String} section Section to which the issue belongs.
   * @param {String[]} images Paths to images for the issue.
   * @param {String} scope Scope of the issue.
   * @param {String} department Department to which the issue belongs.
   * @param {Boolean} isInappropriate Whether the issue has NFSW content.
   * @param {String} userID userID of the user who created the issue.
   * @returns {Promise<Document>} The newly created Issue.
   */
  static async createIssue(
    title,
    description,
    section,
    images,
    department,
    scope,
    isInappropriate,
    userID
  ) {
    return await Issue.create({
      title: title,
      description: description,
      section: section,
      images: images,
      department: department,
      scope: scope,
      isEdited: false,
      isResolved: false,
      isInappropriate: !!isInappropriate,
      upvotes: 0,
      upvoters: [],
      comments: [],
      solutions: [],
      createdBy: userID,
      createdOn: new Date().toLocaleString(),
    });
  }

  /**
   * Updates the issue with new values.
   * @param updatedIssue The object with updated issue properties.
   * @returns {Promise<Document>} The updated issue.
   */
  static async updateIssue(updatedIssue) {
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
      return await issue.save();
    }
    return null;
  }

  /**
   * Deletes the issue with specified ID.
   * @param {String} id ID of the issue to be deleted.
   * @returns {Promise<Document>} The deleted issue.
   */
  static async deleteIssue(id) {
    return await Issue.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { runValidators: true, new: true }
    );
  }
}

module.exports = IssueService;
