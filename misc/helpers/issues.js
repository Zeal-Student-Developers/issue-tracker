/**
 * Filters Issue properties from the given object
 * @param {Document} issue Mongoose Issue Object
 * @param {String} userId ID of the current user
 * @returns {Document} issue object with only required properties
 */
const filterIssueProperties = function (issue, userId) {
  const filteredIssue = JSON.parse(JSON.stringify(issue));

  filteredIssue["commentsCount"] = filteredIssue.comments.length;
  filteredIssue["solutionsCount"] = filteredIssue.solutions.length;
  filteredIssue["isAuthor"] = filteredIssue.createdBy.toString() === userId;
  filteredIssue["hasUpvoted"] = !!filteredIssue.upvoters.find(
    (id) => id.toString() === userId
  );
  filteredIssue["hasReported"] = !!filteredIssue.reporters.find(
    (id) => id.toString() === userId
  );

  delete filteredIssue.__v;
  delete filteredIssue.isDeleted;
  delete filteredIssue.reporters;
  delete filteredIssue.comments;
  delete filteredIssue.solutions;
  delete filteredIssue.createdBy;
  delete filteredIssue.upvoters;

  return filteredIssue;
};

module.exports = { filterIssueProperties };
