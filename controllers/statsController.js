const { Error } = require("../models");

const {
  helpers: {
    statsHelper: { getMonthName },
  },
} = require("../misc");

const {
  StatsService: { getAllIssues },
} = require("../services");

const {
  helpers: {
    issuesHelper: { filterIssueProperties },
  },
} = require("../misc");
const { date } = require("@hapi/joi");

/**
 * Controller to get issue stats based on resolve status
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getIssueStatsController = async function (req, res) {
  const { id, role } = req.user;

  if (role !== "auth_level_three") {
    res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
    return;
  }

  const issues = await getAllIssues();

  let resolvedIssuesCount = 0;
  let violatingIssuesCount = 0;
  let unresolvedIssuesCount = 0;
  const issuesCountByDepartment = {};
  const issuesSolvedByMonth = {};
  const issuesPostedByMonth = {};
  const issuesByDepartment = {};
  const violators = [];

  issues.forEach((issue) => {
    const { isInappropriate, isResolved, department } = issue;

    const createdOn = new Date(issue.createdOn);
    issuesPostedByMonth[getMonthName(createdOn.getMonth())] =
      (issuesPostedByMonth[getMonthName(createdOn.getMonth())] || 0) + 1;

    if (isInappropriate) {
      violatingIssuesCount++;
      if (!violators.includes(issue.createdBy.toString())) {
        violators.push(issue.createdBy.toString());
      }
    }

    if (isResolved) {
      const resolvedOn = new Date(issue.solutions[0].postedOn);
      issuesSolvedByMonth[getMonthName(resolvedOn.getMonth())] =
        (issuesSolvedByMonth[getMonthName(resolvedOn.getMonth())] || 0) + 1;

      resolvedIssuesCount++;
    } else unresolvedIssuesCount++;

    issuesByDepartment[department] = issuesByDepartment[department]
      ? [...issuesByDepartment[department], filterIssueProperties(issue, id)]
      : [filterIssueProperties(issue, id)];

    issuesCountByDepartment[department] =
      (issuesCountByDepartment[department] || 0) + 1;
  });

  for (const key in issuesByDepartment) {
    issuesByDepartment[key] = issuesByDepartment[key].splice(0, 3);
  }

  res.status(200).json({
    code: "OK",
    result: "SUCCESS",
    stats: {
      total: issues.length,
      resolved: resolvedIssuesCount,
      unresolved: unresolvedIssuesCount,
      issuesCountByDepartment,
      violatingIssues: violatingIssuesCount,
      violatingUsersCount: violators.length,
      issuesPostedByMonth,
      issuesSolvedByMonth,
      topIssues: {
        byUpvotes: issues
          .slice(0, 5)
          .map((issue) => filterIssueProperties(issue, id)),
        byDepartment: issuesByDepartment,
      },
    },
  });
};

module.exports = {
  getIssueStats: getIssueStatsController,
};
