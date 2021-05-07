const { Issue } = require("../models");

class StatsService {
  constructor() {}

  /**
   * Finds all the issues from the database.
   * @returns {Promise<Document[]>} List of all the issues.
   */
  async getAllIssues() {
    return await Issue.find({
      isDeleted: false,
    }).sort("-upvotes");
  }
}

module.exports = new StatsService();
