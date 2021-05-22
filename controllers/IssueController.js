const { Error, Image } = require("../models");

const {
  IssueService: {
    getIssueById,
    getIssuesByUserId,
    getAllIssues,
    getAllIssuesByDepartment,
    getAllIssuesByPhrase,
    getAllIssuesByPhraseAndDepartment,
    getComments,
    getSolutions,
    createIssue,
  },
  FileService: { uploadImages, updateImageIssueId, saveImages },
  UserService: { getUserById },
  ModeratorService: { hasNSFWText, hasNSFWImage },
} = require("../services");

const {
  validations: {
    issueValidations: { validateUserData },
  },
  helpers: {
    issuesHelper: { filterIssueProperties },
  },
} = require("../misc");

const { FILE_SERVER_URI } = require("../config");

/** Threshold value for reports count on an issue  */
const ISSUE_REPORTS_THRESHOLD = 75;
/** Threshold value for code of conduct violations by users  */
const USER_VIOLATIONS_THRESHOLD = 5;

/**
 * Controller to handle get all the issues
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getAllIssuesController = async function (req, res) {
  let issues = null;
  const { id, role, department } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;
  try {
    if (role === "auth_level_three") {
      issues = await getAllIssues(pageNumber, pageLimit);
    } else {
      issues = await getAllIssuesByDepartment(
        department,
        pageNumber,
        pageLimit
      );
    }
  } catch (error) {
    return res
      .status(500)
      .send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }

  res.status(200).json({
    code: "OK",
    result: "SUCCESS",
    data: {
      hasNextPage: issues.length > limit,
      hasPreviousPage: page > 1,
      issues: issues
        .slice(0, limit)
        .map((issue) => filterIssueProperties(issue, id)),
    },
  });
};

/**
 * Controller to handle get all the resolved issues
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getAllResolvedIssuesController = async function (req, res) {
  let issues = null;
  const { id, role, department } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;
  try {
    if (role === "auth_level_three") {
      issues = await getAllIssues();
    } else {
      issues = await getAllIssuesByDepartment(
        department,
        pageLimit,
        pageNumber
      );
    }
  } catch (error) {
    return res
      .status(500)
      .send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }

  issues = issues.filter((issue) => issue.isResolved);
  res.status(200).json({
    code: "OK",
    result: "SUCCESS",
    data: {
      hasNextPage: issues.length > limit,
      hasPreviousPage: page > 1,
      issues: issues
        .slice(0, limit)
        .map((issue) => filterIssueProperties(issue, id)),
    },
  });
};

/**
 * Controller to handle get all the unresolved issues
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getAllUnresolvedIssuesController = async function (req, res) {
  let issues = null;
  const { id, role, department } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;
  try {
    if (role === "auth_level_three") {
      issues = await getAllIssues(pageNumber, pageLimit);
    } else {
      issues = await getAllIssuesByDepartment(
        department,
        pageNumber,
        pageLimit
      );
    }
  } catch (error) {
    return res
      .status(500)
      .send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }

  issues = issues.filter((issue) => !issue.isResolved);
  res.status(200).json({
    code: "OK",
    result: "SUCCESS",
    data: {
      hasNextPage: issues.length > limit,
      hasPreviousPage: page > 1,
      issues: issues
        .slice(0, limit)
        .map((issue) => filterIssueProperties(issue, id)),
    },
  });
};

/**
 * Controller to handle get issue by ID
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getIssueByIdController = async function (req, res) {
  let issue = null;
  const { id, role, department } = req.user;
  try {
    issue = await getIssueById(req.params.id);
    if (issue) {
      issue = filterIssueProperties(issue, id);
      if (issue.department !== department && role !== "auth_level_three")
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      else {
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          issue,
        });
      }
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle get issue by user
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getIssuesByUserController = async function (req, res) {
  let issues = null;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;
  try {
    issues = await getIssuesByUserId(req.user.id, pageNumber, pageLimit);
    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      data: {
        hasNextPage: issues.length > limit,
        hasPreviousPage: page > 1,
        issues: issues
          .slice(0, limit)
          .map((issue) => filterIssueProperties(issue, req.user.id)),
      },
    });
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle get issue containing given phrases
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getIssuesByPhraseController = async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const phrase = req.query.phrase;

  if (phrase?.trim()) {
    const pageNumber = page < 1 ? 0 : page - 1;
    const pageLimit = limit < 5 ? 5 : limit;
    const { id, role, department } = req.user;

    try {
      let issues =
        role === "auth_level_three"
          ? await getAllIssuesByPhrase(phrase, pageNumber, pageLimit)
          : await getAllIssuesByPhraseAndDepartment(
              phrase,
              department,
              pageNumber,
              pageLimit
            );

      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        data: {
          hasNextPage: issues.length > limit,
          hasPreviousPage: page > 1,
          issues: issues
            .slice(0, limit)
            .map((issue) => filterIssueProperties(issue, id)),
        },
      });
    } catch (error) {
      res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
  } else {
    res
      .status(400)
      .send(new Error("BAD_REQUEST", "Please provide a phrase to search"));
  }
};

/**
 * Controller to handle get comments for given issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getCommentsController = async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;

  const { id } = req.params;
  try {
    const issue = await getComments(id, pageNumber, pageLimit);

    if (!issue)
      return res.status(403).send(new Error("BAD_REQUEST", "No issue found"));

    const { comments, department, scope } = issue;

    if (
      scope === "ORGANIZATION" ||
      department === req.user.department ||
      req.user.role === "auth_level_three"
    ) {
      return res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        data: {
          hasNextPage: comments.length > limit,
          hasPreviousPage: page > 1,
          comments: comments.slice(0, limit),
        },
      });
    }
    res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle get solutions for given issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getSolutionsController = async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;

  const { id } = req.params;
  try {
    const issue = await getSolutions(id, pageNumber, pageLimit);
    if (!issue)
      return res.status(401).send(new Error("BAD_REQUEST", "No issue found"));

    const { solutions, department, scope } = issue;

    if (
      scope === "ORGANIZATION" ||
      department === req.user.department ||
      req.user.role === "auth_level_three"
    ) {
      const solutionList = [];

      for (let index = 0; index < limit; index++) {
        const { solution, postedBy, postedOn } = solutions[index];
        const { firstName, lastName } = await getUserById(postedBy);
        solutionList.push({
          solution,
          postedBy: { id: postedBy, firstName, lastName },
          postedOn,
        });
      }

      return res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        data: {
          hasNextPage: solutions.length > limit,
          hasPreviousPage: page > 1,
          solutions: solutionList,
        },
      });
    }
    res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle image uploading to file server
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const saveImagesController = function (req, res) {
  saveImages(req, res, async (err) => {
    if (err) {
      res.status(400).send(new Error("BAD_REQUEST", err.message));
      return;
    }

    const files = req.files;
    const { id } = req.user;
    if (files.length === 0) {
      return res
        .status(400)
        .send(new Error("BAD_REQUEST", "Please provide images to save"));
    }
    try {
      const data = await uploadImages(files, id);
      if (data) {
        const paths = [];
        for (let index = 0; index < data.files.length; index++) {
          const file = data.files[index];

          const url = `${FILE_SERVER_URI}/${file.path}`;
          paths.push(url);

          const { id: imageId } = await Image.create({
            path: url,
            mimetype: file.mimetype,
            userId: req.user.id,
            issueId: null,
            createdOn: file.createdOn,
          });

          const isNSFW = await hasNSFWImage(url);

          if (isNSFW) {
            const user = await getUserById(id);

            user.violations.push(imageId);
            if (user.violations.length >= USER_VIOLATIONS_THRESHOLD) {
              user.isDisabled = true;
            }

            await user.save();

            return res
              .status(403)
              .send(
                new Error(
                  "FORBIDDEN",
                  "Your post goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
                )
              );
          }
        }

        return res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          files: paths,
        });
      }
      res
        .status(500)
        .send(new Error("INTERNAL_SERVER_ERROR", "Something went wrong"));
    } catch (error) {
      console.log(error);
      res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
    }
  });
};

/**
 * Controller to handle add new issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const addIssueController = async function (req, res) {
  const { title, description, images, section, scope } = req.body;
  const { department, id } = req.user;
  try {
    const errors = validateUserData(title, description, images, section, scope);
    if (errors) {
      res.status(400).send(new Error("BAD_REQUEST", errors));
    } else {
      const isNSFW = await hasNSFWText(title, description, scope);

      const { id: issueId } = await createIssue(
        title,
        description,
        section,
        images,
        department,
        scope.toUpperCase(),
        isNSFW,
        id
      );

      if (images.length > 0) await updateImageIssueId(images, issueId);

      if (isNSFW) {
        const user = await getUserById(id);

        user.violations.push(issueId);
        if (user.violations.length >= USER_VIOLATIONS_THRESHOLD) {
          user.isDisabled = true;
        }

        await user.save();

        return res
          .status(403)
          .send(
            new Error(
              "FORBIDDEN",
              "Your post contains content which goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
            )
          );
      }

      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        message: "Issue created",
      });
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle updating issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const updateIssueController = async function (req, res) {
  const { id: userId } = req.user;
  let { title, description } = req.body;
  try {
    const issue = await getIssueById(req.params.id);
    if (issue) {
      if (issue.createdBy.toString() !== userId) {
        return res
          .status(403)
          .send(new Error("FORBIDDEN", "Action not allowed"));
      }

      title = title?.trim?.();
      description = description?.trim?.();
      if (!title && !description) {
        return res
          .status(400)
          .send(new Error("BAD_REQUEST", "Please provide some data"));
      }

      issue.title = title || issue.title;
      issue.description = description || issue.description;
      issue.isEdited = true;

      await issue.save();
      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        message: "Issue updated",
      });
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to toggle issue resolve status
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const toggleResolveStatusController = async function (req, res) {
  let issue = null;
  const { id, role } = req.user;
  try {
    issue = await getIssueById(req.params.id);
    if (issue) {
      if (issue.createdBy.toString() === id || role === "moderator") {
        issue.isResolved = !issue.isResolved;
        await issue.save();
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          message: issue.isResolved
            ? "Issue marked as resolved"
            : "Issue marked as unresolved",
        });
      } else {
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      }
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to toggle upvote
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const toggleUpvoteController = async function (req, res) {
  let issue = null;
  const { department, id: userId } = req.user;
  try {
    issue = await getIssueById(req.params.id);
    if (issue) {
      if (department !== issue.department && issue.scope !== "ORGANIZATION")
        return res
          .status(403)
          .send(new Error("FORBIDDEN", "Action not allowed"));

      let userAlreadyUpvoted = false;
      if (issue.upvoters.findIndex((id) => id.toString() === userId)) {
        issue.upvotes++;
        issue.upvoters.push(userId);
      } else {
        userAlreadyUpvoted = true;
        issue.upvotes--;
        issue.upvoters = issue.upvoters.filter(
          (id) => id.toString() !== userId
        );
      }

      await issue.save();
      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        message: userAlreadyUpvoted
          ? "Removed upvote from issue"
          : "Upvoted issue",
      });
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to toggle issue as inappropriate
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const toggleInappropriateController = async function (req, res) {
  const { id: userId, department, role } = req.user;
  let userReported = false;

  try {
    const issue = await getIssueById(req.params.id);
    if (issue) {
      if (
        issue.department === department ||
        ["auth_level_two", "auth_level_three"].includes(role)
      ) {
        if (issue.reporters.find((id) => id.toString() === userId)) {
          issue.reporters = issue.reporters.filter(
            (id) => id.toString() !== userId
          );
        } else {
          issue.reporters.push(userId);
          userReported = true;
        }

        const author = await getUserById(issue.createdBy.toString());
        if (issue.reporters.length >= ISSUE_REPORTS_THRESHOLD) {
          issue.isInappropriate = true;
          if (!author.violations.find((id) => id.toString() === issue.id)) {
            author.violations.push(issue.id);
          }
        } else {
          issue.isInappropriate = false;
          if (author.violations.find((id) => id.toString() === issue.id)) {
            author.violations = author.violations.filter(
              (id) => id.toString() !== issue.id
            );
          }
        }
        author.isDisabled =
          author.violations.length >= USER_VIOLATIONS_THRESHOLD;

        await author.save();
        await issue.save();

        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          message: userReported
            ? "Issue marked as inappropriate"
            : "Inappropriate mark for the issue removed",
        });
      } else {
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      }
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle post comment on issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const postCommentController = async function (req, res) {
  let issue = null;
  const { id, department } = req.user;
  try {
    issue = await getIssueById(req.params.id);

    if (issue) {
      if (department !== issue.department && issue.scope !== "ORGANIZATION")
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      else {
        const { comment } = req.body;
        if (!comment?.trim()) {
          return res
            .status(400)
            .send(
              new Error("BAD_REQUEST", "Please provide a valid comment String")
            );
        }

        const isNSFW = await hasNSFWText(comment);

        issue.comments.push({
          comment: comment.trim(),
          postedBy: id,
          isInappropriate: isNSFW,
        });
        const { comments } = await issue.save();

        if (isNSFW) {
          // Get the _id of latest comment marked as inappropriate
          const commentId = comments
            .filter(
              ({ isInappropriate, postedBy }) =>
                isInappropriate && postedBy.toString() === id
            )
            .sort(
              ({ postedOn: a }, { postedOn: b }) =>
                new Date(b).getTime() - new Date(a).getTime()
            )[0]._id;

          const user = getUserById(id);

          user.violations.push(commentId);
          if (user.violations.length >= USER_VIOLATIONS_THRESHOLD) {
            user.isDisabled = true;
          }

          await user.save();

          return res
            .status(403)
            .send(
              new Error(
                "FORBIDDEN",
                "Your comment goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
              )
            );
        }

        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          message: "Comment posted",
        });
      }
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to handle post solution on issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const postSolutionController = async function (req, res) {
  let issue = null;
  const { solution } = req.body;
  if (!solution?.trim()) {
    return res
      .status(400)
      .send(new Error("BAD_REQUEST", "Please provide a valid solution string"));
  }
  const { id, role, department } = req.user;
  try {
    issue = await getIssueById(req.params.id);

    if (issue) {
      if (
        ["user", "moderator"].includes(role) ||
        (role === "auth_level_one" && department !== issue.department)
      )
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      else {
        const isNSFW = await hasNSFWText(solution);

        issue.solutions.push({
          solution: solution.trim(),
          postedBy: id,
          isInappropriate: isNSFW,
        });

        const { solutions } = await issue.save();

        if (isNSFW) {
          // Get the _id of latest solution marked as inappropriate
          const solutionId = solutions
            .filter(
              ({ isInappropriate, postedBy }) =>
                isInappropriate && postedBy.toString() === id
            )
            .sort(
              ({ postedOn: a }, { postedOn: b }) =>
                new Date(b).getTime() - new Date(a).getTime()
            )[0]._id;

          const user = getUserById(id);

          user.violations.push(solutionId);
          if (user.violations.length >= USER_VIOLATIONS_THRESHOLD) {
            user.isDisabled = true;
          }

          await user.save();

          return res
            .status(403)
            .send(
              new Error(
                "FORBIDDEN",
                "Your solution goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
              )
            );
        }

        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          message: "Solution posted",
        });
      }
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to delete issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const deleteIssueController = async function (req, res) {
  let issue = null;
  const { role, id } = req.user;
  try {
    issue = await getIssueById(req.params.id);

    if (issue) {
      if (issue.createdBy.toString() === id || role === "moderator") {
        issue.isDeleted = true;
        await issue.save();

        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          message: "Issue deleted",
        });
      } else {
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      }
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } catch (error) {
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

module.exports = {
  addIssue: addIssueController,
  getAllIssues: getAllIssuesController,
  getAllResolvedIssues: getAllResolvedIssuesController,
  getAllUnresolvedIssues: getAllUnresolvedIssuesController,
  getIssueById: getIssueByIdController,
  getIssuesByUser: getIssuesByUserController,
  getIssuesByPhrase: getIssuesByPhraseController,
  getComments: getCommentsController,
  getSolutions: getSolutionsController,
  saveImagesController,
  updateIssue: updateIssueController,
  postComment: postCommentController,
  postSolution: postSolutionController,
  toggleResolveStatus: toggleResolveStatusController,
  toggleUpvote: toggleUpvoteController,
  toggleInappropriate: toggleInappropriateController,
  deleteIssue: deleteIssueController,
};
