const Joi = require("@hapi/joi");
const issueService = require("../services/IssueService");
const { getUserById } = require("../services/UserService");
const Error = require("../models/Error");
const Image = require("../models/Image");
const { uploadImages, updateImageIssueId } = require("../services/FileService");

/** Threshold value for reports count on an issue  */
const ISSUE_REPORTS_THRESHOLD = 75;
/** Threshold value for code of conduct violations by users  */
const USER_VIOLATIONS_THRESHOLD = 5;

/**
 * Controller to get all the issues
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getAllIssues = async (req, res) => {
  let issues = null;
  const { id, role, department } = req.user;
  try {
    if (role === "auth_level_three") {
      issues = await issueService.getAllIssues();
    } else {
      issues = await issueService.getAllIssuesByDepartment(department);
    }
    issues = issues.map((issue) => filterIssueProperties(issue, id));
  } catch (error) {
    return res
      .status(500)
      .send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
  res.status(200).json({
    code: "OK",
    result: "SUCCESS",
    issues,
  });
};

/**
 * Controller to get all the resolved issues
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getAllResolvedIssues = async (req, res) => {
  let issues = null;
  const { id, role, department } = req.user;
  try {
    if (role === "auth_level_three") {
      issues = await issueService.getAllIssues();
    } else {
      issues = await issueService.getAllIssuesByDepartment(department);
    }
    issues = issues.map((issue) => filterIssueProperties(issue, id));
  } catch (error) {
    return res
      .status(500)
      .send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
  issues = issues.filter((issue) => issue.isResolved);
  res.status(200).json({
    code: "OK",
    result: "SUCCESS",
    issues,
  });
};

/**
 * Controller to get all the unresolved issues
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getAllUnresolvedIssues = async (req, res) => {
  let issues = null;
  const { id, role, department } = req.user;
  try {
    if (role === "auth_level_three") {
      issues = await issueService.getAllIssues();
    } else {
      issues = await issueService.getAllIssuesByDepartment(department);
    }
    issues = issues.map((issue) => filterIssueProperties(issue, id));
  } catch (error) {
    return res
      .status(500)
      .send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
  issues = issues.filter((issue) => !issue.isResolved);
  res.status(200).json({
    code: "OK",
    result: "SUCCESS",
    issues,
  });
};

/**
 * Controller to get issue by ID
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getIssueById = async (req, res) => {
  let issue = null;
  const { id, role, department } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
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
 * Controller to get issue containing given phrases
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getIssuesByPhrase = async (req, res) => {
  const { phrase } = req.body;
  if (phrase) {
    const { id, role, department } = req.user;
    try {
      let issues = await issueService.getAllIssuesByPhrase(phrase);
      issues = issues.map((issue) => filterIssueProperties(issue, id));
      if (role === "auth_level_three") {
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          issues,
        });
      } else {
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          issues: issues.filter(
            (issue) =>
              issue.department === department || issue.scope === "INSTITUTE"
          ),
        });
      }
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
 * Controller to upload images to file server
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const saveImages = async (req, res) => {
  const files = req.files;
  const { id } = req.user;
  try {
    const data = await uploadImages(files, id);
    if (data) {
      const paths = [];
      data.files.forEach(async (file) => {
        const path = `${process.env.FILE_SERVER_URI}/${file.path}`;
        paths.push(path);

        await Image.create({
          path,
          mimetype: file.mimetype,
          userId: req.user.id,
          issueId: null,
          createdOn: file.createdOn,
        });
      });
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
};

/**
 * Controller to add new issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const addIssue = async (req, res) => {
  const { title, description, images, section, scope } = req.body;
  const { department, id } = req.user;
  try {
    const { error } = validateData(title, description, images, section, scope);
    if (error) {
      const errors = {};
      error.details.forEach(({ path, message }) => (errors[path] = message));
      res.status(400).send(new Error("BAD_REQUEST", errors));
    } else {
      await issueService.addIssue(
        title,
        description,
        section,
        images,
        department,
        scope,
        id
      );
      if (images.length > 0) await updateImageIssueId(images, id);
      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        message: "Issue created",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(new Error("INTERNAL_SERVER_ERROR", error.message));
  }
};

/**
 * Controller to update issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const updateIssue = async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const { title, description } = req.body;
  try {
    const issue = await issueService.getIssueById(id);
    if (issue) {
      if (issue.createdBy.toString() !== userId) {
        return res
          .status(403)
          .send(new Error("FORBIDDEN", "Action not allowed"));
      }
      issue.title = title;
      issue.description = description;
      issue.isEdited = true;
      await issue.save();
      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        message: "Issue updated",
      });
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "NO issue found"));
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
const toggleResolveStatus = async (req, res) => {
  let issue = null;
  const { id, role } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
    if (issue) {
      if (issue.createdBy.toString() === id || role === "student_moderator") {
        issue.isResolved = !issue.isResolved;
        await issue.save();
        res.status(200).json({
          code: "OK",
          result: "SUCCESS",
          message: "Resolve status updated",
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
 * Controller to delete upvote
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const toggleUpvote = async (req, res) => {
  let issue = null;
  const { id } = req.params;
  const { department, id: userId } = req.user;
  try {
    issue = await issueService.getIssueById(id);
    if (issue) {
      if (department !== issue.department && issue.scope !== "INSTITUTE")
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
const toggleInappropriate = async (req, res) => {
  const { id } = req.params;
  const { id: userId, department, role } = req.user;
  let userReported = false;

  try {
    const issue = await issueService.getIssueById(id);
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
 * Controller to post a comment on the issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const postComment = async (req, res) => {
  let issue = null;
  const { comment } = req.body;
  const { id, department } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
    if (issue) {
      // If the issue is not GLOBAL & user is not of the same dept, return
      // error
      if (department !== issue.department && issue.scope !== "INSTITUTE")
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      else {
        issue.comments.push({ comment, postedBy: id });
        await issue.save();
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
 * Controller to post a solution on the issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const postSolution = async (req, res) => {
  let issue = null;
  const { solution } = req.body;
  const { id, role, department } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
    if (issue) {
      if (
        ["student", "student_moderator"].includes(role) ||
        (role === "auth_level_one" && department !== issue.department)
      )
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      else {
        issue.solution.push({ solution, postedBy: id });
        await issue.save();
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
const deleteIssue = async (req, res) => {
  let issue = null;
  const { role, id } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
    if (issue) {
      if (issue.createdBy.toString() === id || role === "student_moderator") {
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

/**
 * Filters Issue properties from the given object
 * @param {Document} issue Mongoose Issue Object
 * @param {String} userId ID of the current user
 * @returns {Document} issue object with only required properties
 */
const filterIssueProperties = function (issue, userId) {
  const filteredIssue = JSON.parse(JSON.stringify(issue));

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
  delete filteredIssue.createdBy;
  delete filteredIssue.upvoters;

  return filteredIssue;
};

// Validations functions

/**
 * Validates data from user for creating new issue
 * @param {String} title Title of the issue
 * @param {String} description Description of issue
 * @param {String} section Section of issue
 * @param {String} scope Issue scope
 */
const validateData = (title, description, images, section, scope) => {
  const schema = Joi.object({
    title: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid title" })
      .required(),
    description: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid description" })
      .required(),
    images: Joi.array().max(3).required(),
    section: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid section" })
      .required(),
    scope: Joi.string()
      .regex(/^INSTITUTE|DEPARTMENT$/)
      .rule({ message: "Scope must be either 'INSTITUTE' or 'DEPARTMENT'" })
      .required(),
  }).options({ abortEarly: false });

  return schema.validate({ title, description, images, section, scope });
};

module.exports = {
  getAllIssues,
  getAllResolvedIssues,
  getAllUnresolvedIssues,
  getIssueById,
  getIssuesByPhrase,
  saveImages,
  addIssue,
  updateIssue,
  postComment,
  postSolution,
  toggleResolveStatus,
  toggleUpvote,
  toggleInappropriate,
  deleteIssue,
};
