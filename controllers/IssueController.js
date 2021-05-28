const { APIError, Image } = require("../models");

const {
  IssueService: {
    getIssueById,
    getIssuesByUserId,
    getAllIssues,
    getAllIssuesByResolveStatus,
    getAllIssuesByDepartment,
    getAllIssuesByDepartmentAndResolveStatus,
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
    issueValidations: { validateIssueData, validateIssueUpdateData },
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
 * @param {Express.NextFunction} next Express Next Function
 */
const getAllIssuesController = async function (req, res, next) {
  const { id, role, department } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;
  try {
    const issues =
      role === "auth_level_three"
        ? await getAllIssues(pageNumber, pageLimit)
        : await getAllIssuesByDepartment(department, pageNumber, pageLimit);

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
    next(error);
  }
};

/**
 * Controller to handle get all issues by resolve status
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const getAllIssuesByResolveStatusController = async function (req, res, next) {
  const { id, role, department } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const isResolved = req.query.resolved === "true";

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;
  try {
    const issues =
      role === "auth_level_three"
        ? await getAllIssuesByResolveStatus(isResolved, pageNumber, pageLimit)
        : await getAllIssuesByDepartmentAndResolveStatus(
            department,
            isResolved,
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
    next(error);
  }
};

/**
 * Controller to handle get issue by ID
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const getIssueByIdController = async function (req, res, next) {
  let issue = null;
  const { id, role, department } = req.user;
  try {
    issue = await getIssueById(req.params.id);
    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    if (
      issue.department !== department &&
      issue.scope !== "ORGANIZATION" &&
      role !== "auth_level_three"
    ) {
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");
    }

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      issue: filterIssueProperties(issue, id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle get issue by user
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const getIssuesByUserController = async function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;
  try {
    const issues = await getIssuesByUserId(req.user.id, pageNumber, pageLimit);

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
    next(error);
  }
};

/**
 * Controller to handle get issue containing given phrases
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const getIssuesByPhraseController = async function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const phrase = req.query.phrase;

  if (!phrase?.trim?.())
    throw new APIError(
      APIError.BAD_REQUEST,
      "Please provide a phrase to search"
    );

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;
  const { id, role, department } = req.user;

  try {
    const issues =
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
    next(error);
  }
};

/**
 * Controller to handle get comments for given issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const getCommentsController = async function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;

  const { id } = req.params;

  try {
    const issue = await getComments(id, pageNumber, pageLimit);

    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    const { comments, department, scope } = issue;

    if (
      !(
        scope === "ORGANIZATION" ||
        department === req.user.department ||
        req.user.role === "auth_level_three"
      )
    )
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      data: {
        hasNextPage: comments.length > limit,
        hasPreviousPage: page > 1,
        comments: comments.slice(0, limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle get solutions for given issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const getSolutionsController = async function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;

  const pageNumber = page < 1 ? 0 : page - 1;
  const pageLimit = limit < 5 ? 5 : limit;

  const { id } = req.params;
  try {
    const issue = await getSolutions(id, pageNumber, pageLimit);
    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    const { solutions, department, scope } = issue;

    if (
      !(
        scope === "ORGANIZATION" ||
        department === req.user.department ||
        req.user.role === "auth_level_three"
      )
    )
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");

    const solutionList = [];

    const length = limit < solutions.length ? limit : solutions.length;
    for (let index = 0; index < length; index++) {
      const { solution, postedBy, postedOn } = solutions[index];
      const { firstName, lastName } = await getUserById(postedBy);
      solutionList.push({
        solution,
        postedBy: { id: postedBy, firstName, lastName },
        postedOn,
      });
    }

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      data: {
        hasNextPage: solutions.length > limit,
        hasPreviousPage: page > 1,
        solutions: solutionList,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle image uploading to file server
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const saveImagesController = function (req, res, next) {
  saveImages(req, res, async (err) => {
    try {
      if (err) throw new APIError(APIError.BAD_REQUEST, err.message);

      const files = req.files;
      const { id } = req.user;
      if (files.length === 0) {
        throw new APIError(
          APIError.BAD_REQUEST,
          "Please provide image to save"
        );
      }

      const data = await uploadImages(files, id);
      if (!data) {
        throw new APIError(
          APIError.INTERNAL_SERVER_ERROR,
          "Something went wrong"
        );
      }

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

          throw new APIError(
            APIError.FORBIDDEN,
            "Your post goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
          );
        }
      }

      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        files: paths,
      });
    } catch (error) {
      next(error);
    }
  });
};

/**
 * Controller to handle add new issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const addIssueController = async function (req, res, next) {
  const { title, description, images, section, scope } = req.body;
  const { department, id } = req.user;
  try {
    const errors = validateIssueData(
      title,
      description,
      images,
      section,
      scope
    );
    if (errors) throw new APIError(APIError.BAD_REQUEST, errors);

    const isNSFW = await hasNSFWText(title, description, section);

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

      throw new APIError(
        APIError.FORBIDDEN,
        "Your post goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
      );
    }

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "Issue created",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle updating issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const updateIssueController = async function (req, res, next) {
  const { id: userId } = req.user;
  try {
    const issue = await getIssueById(req.params.id);
    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    if (issue.createdBy.toString() !== userId) {
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");
    }

    const { title, description } = validateIssueUpdateData({
      title: req.body.title,
      description: req.body.description,
    });

    if (!title && !description) {
      throw new APIError(APIError.BAD_REQUEST, "Please provide some data");
    }

    issue.title = title || issue.title;
    issue.description = description || issue.description;
    issue.isEdited = true;

    const isNSFW = await hasNSFWText(title, description);
    if (isNSFW) {
      const user = await getUserById(userId);

      issue.isInappropriate = true;
      user.violations.push(issue.id);
      if (user.violations.length >= USER_VIOLATIONS_THRESHOLD) {
        user.isDisabled = true;
      }

      issue.isInappropriate = true;

      await user.save();
      await issue.save();

      throw new APIError(
        APIError.FORBIDDEN,
        "Your post goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
      );
    }

    await issue.save();
    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "Issue updated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to toggle issue resolve status
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const toggleResolveStatusController = async function (req, res, next) {
  let issue = null;
  const { id, role } = req.user;
  try {
    issue = await getIssueById(req.params.id);
    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    if (!(issue.createdBy.toString() === id || role === "moderator")) {
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");
    }

    issue.isResolved = !issue.isResolved;
    await issue.save();
    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: issue.isResolved
        ? "Issue marked as resolved"
        : "Issue marked as unresolved",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to toggle upvote
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const toggleUpvoteController = async function (req, res, next) {
  let issue = null;
  const { department, id: userId, role } = req.user;
  try {
    issue = await getIssueById(req.params.id);
    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    if (
      department !== issue.department &&
      issue.scope !== "ORGANIZATION" &&
      role !== "auth_level_three"
    )
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");

    let userUpvoted = true;
    if (issue.upvoters.find((id) => id.toString() === userId)) {
      userUpvoted = false;
      issue.upvotes -= 1;
      issue.upvoters = issue.upvoters.filter((id) => id.toString() !== userId);
    } else {
      issue.upvotes += 1;
      issue.upvoters.push(userId);
    }

    await issue.save();
    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: userUpvoted ? "Issue upvoted" : "Upvote removed from issue",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to toggle issue as inappropriate
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const toggleInappropriateController = async function (req, res, next) {
  const { id: userId, department, role } = req.user;
  let userReported = false;

  try {
    const issue = await getIssueById(req.params.id);
    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    if (
      issue.department !== department &&
      !["auth_level_two", "auth_level_three"].includes(role)
    ) {
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");
    }

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
    author.isDisabled = author.violations.length >= USER_VIOLATIONS_THRESHOLD;

    await author.save();
    await issue.save();

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: userReported
        ? "Issue marked as inappropriate"
        : "Inappropriate mark for the issue removed",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle post comment on issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const postCommentController = async function (req, res, next) {
  const { id, department } = req.user;
  try {
    const issue = await getIssueById(req.params.id);

    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    if (department !== issue.department && issue.scope !== "ORGANIZATION") {
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");
    }

    const { comment } = req.body;
    if (!comment?.trim()) {
      throw new APIError(
        APIError.BAD_REQUEST,
        "Please provide a valid comment"
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

      const user = await getUserById(id);

      user.violations.push(commentId);
      if (user.violations.length >= USER_VIOLATIONS_THRESHOLD) {
        user.isDisabled = true;
      }

      await user.save();

      throw new APIError(
        APIError.FORBIDDEN,
        "Your comment goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
      );
    }

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "Comment posted",
    });
  } catch (error) {
    // console.log(error);
    next(error);
  }
};

/**
 * Controller to handle post solution on issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const postSolutionController = async function (req, res, next) {
  try {
    const { id, role, department } = req.user;

    const issue = await getIssueById(req.params.id);
    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    if (role === "auth_level_one" && department !== issue.department)
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");

    const { solution } = req.body;
    if (!solution?.trim()) {
      throw new APIError(
        APIError.BAD_REQUEST,
        "Please provide a valid solution"
      );
    }

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

      const user = await getUserById(id);

      user.violations.push(solutionId);
      if (user.violations.length >= USER_VIOLATIONS_THRESHOLD) {
        user.isDisabled = true;
      }

      await user.save();

      throw new APIError(
        APIError.FORBIDDEN,
        "Your comment goes against our Code of Conduct. Please refrain from posted such content. Repeated violations of Code of Conduct may result in you being banned from accessing the system."
      );
    }

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "Solution posted",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to delete issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express Next Function
 */
const deleteIssueController = async function (req, res, next) {
  const { role, id, department } = req.user;
  try {
    const issue = await getIssueById(req.params.id);
    if (!issue) throw new APIError(APIError.BAD_REQUEST, "No issue found");

    if (
      (issue.createdBy.toString() !== id && role !== "moderator") ||
      (role === "moderator" && department !== issue.department)
    ) {
      throw new APIError(APIError.FORBIDDEN, "Action not allowed");
    }

    issue.isDeleted = true;
    await issue.save();

    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message: "Issue deleted",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addIssue: addIssueController,
  getAllIssues: getAllIssuesController,
  getAllIssuesByStatus: getAllIssuesByResolveStatusController,
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
