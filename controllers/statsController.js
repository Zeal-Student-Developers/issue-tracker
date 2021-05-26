const {
  helpers: {
    statsHelper: { getMonthName },
    issuesHelper: { filterIssueProperties },
  },
} = require("../misc");

const {
  StatsService: { getAllIssues, getAllAuthority },
} = require("../services");

/**
 * Controller to get issue stats based on resolve status
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction}
 */
const getIssueStatsController = async function (req, res, next) {
  const { id } = req.user;

  try {
    let resolvedIssuesCount = 0;
    let violatingIssuesCount = 0;
    let unresolvedIssuesCount = 0;
    const issuesCountByDepartment = {};
    const issuesSolvedByMonth = {};
    const issuesPostedByMonth = {};
    const issuesByDepartment = {};
    const violators = [];

    const issues = await getAllIssues();

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

      if (issuesByDepartment.hasOwnProperty(department)) {
        issuesByDepartment[department].push(issue);
      } else {
        issuesByDepartment[department] = [issue];
      }

      issuesCountByDepartment[department] =
        (issuesCountByDepartment[department] || 0) + 1;
    });

    for (const key in issuesByDepartment) {
      issuesByDepartment[key] = issuesByDepartment[key].slice(0, 3);
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
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get authority stats
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction}
 */
const getAuthorityStatsController = async function (_, res, next) {
  try {
    const authorityCountByRole = {
      auth_level_one: 0,
      auth_level_two: 0,
      auth_level_three: 0,
    };

    const authorityCommentsAndSolutions = {};
    const users = await getAllAuthority();

    users.forEach(({ id, firstName, lastName, role }) => {
      authorityCountByRole[role] += 1;

      authorityCommentsAndSolutions[id] = {
        name: `${firstName} ${lastName}`,
        commentsCount: 0,
        solutionsCount: 0,
      };
    });

    const issues = await getAllIssues();

    issues.forEach(({ solutions, comments }) => {
      solutions.forEach(({ postedBy }) => {
        authorityCommentsAndSolutions[postedBy].solutionsCount += 1;
      });

      comments.forEach(({ postedBy }) => {
        if (authorityCommentsAndSolutions.hasOwnProperty(postedBy)) {
          authorityCommentsAndSolutions[postedBy].commentsCount += 1;
        }
      });
    });

    const authorityCommentsAndSolutionsList = Object.values(
      authorityCommentsAndSolutions
    );

    const solutions = {
      min: {
        count: Number.MAX_VALUE,
        name: "",
      },
      max: {
        count: 0,
        name: "",
      },
    };

    const comments = {
      min: {
        count: Number.MAX_VALUE,
        name: "",
      },
      max: {
        count: 0,
        name: "",
      },
    };

    authorityCommentsAndSolutionsList.forEach(
      ({ name, commentsCount, solutionsCount }) => {
        // Min and max solutions count
        if (solutionsCount > solutions.max.count) {
          solutions.max.count = solutionsCount;
          solutions.max.name = name;
        } else if (solutionsCount < solutions.min.count) {
          solutions.min.count = solutionsCount;
          solutions.min.name = name;
        }

        // Min and max comments count
        if (commentsCount > comments.max.count) {
          comments.max.count = commentsCount;
          comments.max.name = name;
        } else if (commentsCount < comments.min.count) {
          comments.min.count = commentsCount;
          comments.min.name = name;
        }
      }
    );

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      stats: {
        totalAuthorityUsers: users.length,
        authorityCountByRole,
        authorityCommentsAndSolutions: authorityCommentsAndSolutionsList,
        distribution: {
          maxSolutions: solutions.max,
          minSolutions: solutions.min,
          maxComments: comments.max,
          minComments: comments.min,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIssueStats: getIssueStatsController,
  getAuthorityStats: getAuthorityStatsController,
};
