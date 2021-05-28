const { Issue, User } = require("../models");

class StatsService {
  constructor() {}

  /**
   * Finds all the issues from the database.
   * @returns {Promise<Document[]>} List of all the issues.
   */
  static async getAllIssues() {
    return await Issue.find({
      isDeleted: false,
    }).sort("-upvotes");
  }

  /**
   * Finds all authority users
   * @returns {Promise<Document[]} List of all authority personnels
   */
  static async getAllAuthority() {
    return await User.find({
      $or: [
        { role: "auth_level_one" },
        { role: "auth_level_two" },
        { role: "auth_level_three" },
      ],
    });
  }
}

module.exports = StatsService;
