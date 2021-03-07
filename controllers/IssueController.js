const Joi = require("@hapi/joi");
const issueService = require("../services/IssueService");
const Error = require("../models/Error");

/**
 * Controller to get all the issues
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const getAllIssues = async (req, res) => {
  let issues = null;
  const { role, department } = req.user;
  try {
    if (role === "auth_level_three") {
      issues = await issueService.getAllIssues();
    } else {
      issues = await issueService.getAllIssuesByDepartment(department);
    }
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
  const { role, department } = req.user;
  try {
    if (role === "auth_level_three") {
      issues = await issueService.getAllIssues();
    } else {
      issues = await issueService.getAllIssuesByDepartment(department);
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
  const { role, department } = req.user;
  try {
    if (role === "auth_level_three") {
      issues = await issueService.getAllIssues();
    } else {
      issues = await issueService.getAllIssuesByDepartment(department);
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
  const { role, department } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);

    if (issue) {
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
 * Controller to add new issue
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 */
const addIssue = async (req, res) => {
  const { title, description, section, scope } = req.body;
  const { department, zprn } = req.user;
  try {
    const { error } = validateData(title, description, section, scope);
    if (error) {
      const errors = {};
      error.details.forEach(({ path, message }) => (errors[path] = message));
      res.status(400).send(new Error("BAD_REQUEST", errors));
    } else {
      await issueService.addIssue(
        title,
        description,
        section,
        department,
        scope,
        zprn
      );
      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        message: "Issue created",
      });
    }
  } catch (error) {
    console.log(error.message);
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
  const { zprn } = req.user;
  const { title, description } = req.body;
  try {
    const issue = await issueService.getIssueById(id);
    if (issue) {
      if (issue.createdBy !== zprn) {
        return res
          .status(403)
          .send(new Error("FORBIDDEN", "Action not allowed"));
      }
      issue.title = title;
      issue.description = description;
      res.isEdited = true;
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
  const { zprn, role } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
    if (issue) {
      if (issue.createdBy === zprn || role === "student_moderator") {
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
  const { department, zprn } = req.user;
  try {
    issue = await issueService.getIssueById(id);
    if (issue) {
      if (department !== issue.department && issue.scope !== "INSTITUTE")
        return res
          .status(403)
          .send(new Error("FORBIDDEN", "Action not allowed"));

      let userAlreadyUpvoted = false;
      if (issue.upvoters.findIndex((id) => id === zprn)) {
        issue.upvotes++;
        issue.upvoters.push(zprn);
      } else {
        userAlreadyUpvoted = true;
        issue.upvotes--;
        issue.upvoters = issue.upvoters.filter((id) => id !== zprn);
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
  const { role } = req.user;
  if (role === "student_moderator") {
    const issue = await issueService.getIssueById(id);
    if (issue) {
      issue.isInappropriate = !issue.isInappropriate;
      await issue.save();
      res.status(200).json({
        code: "OK",
        result: "SUCCESS",
        message: issue.isInappropriate
          ? "Issue marked as inappropriate"
          : "Inappropriate mark for the issue removed",
      });
    } else {
      res.status(400).send(new Error("BAD_REQUEST", "No issue found"));
    }
  } else {
    res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
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
  const { zprn, department } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
    if (issue) {
      // If the issue is not GLOBAL & user is not of the same dept, return
      // error
      if (department !== issue.department && issue.scope !== "INSTITUTE")
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      else {
        issue.comments.push({ comment, postedBy: zprn });
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
  const { zprn, role, department } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
    if (issue) {
      if (
        ["student", "student_moderator"].includes(role) ||
        (role === "auth_level_one" && department !== issue.department)
      )
        res.status(403).send(new Error("FORBIDDEN", "Action not allowed"));
      else {
        issue.solution.push({ solution, postedBy: zprn });
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
  const { role, zprn } = req.user;
  try {
    issue = await issueService.getIssueById(req.params.id);
    if (issue) {
      if (issue.createdBy === zprn || role === "student_moderator") {
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

// Validations functions

/**
 * Validates data from user for creating new issue
 * @param {String} title Title of the issue
 * @param {String} description Description of issue
 * @param {String} section Section of issue
 * @param {String} scope Issue scope
 */
const validateData = (title, description, section, scope) => {
  const schema = Joi.object({
    title: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid title" })
      .required(),
    description: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid description" })
      .required(),
    section: Joi.string()
      .regex(/\w+/)
      .rule({ message: "Please provide a valid section" })
      .required(),
    scope: Joi.string()
      .regex(/^INSTITUTE|DEPARTMENT$/)
      .rule({ message: "Scope must be either 'INSTITUTE' or 'DEPARTMENT'" })
      .required(),
  }).options({ abortEarly: false });

  return schema.validate({ title, description, section, scope });
};

module.exports = {
  getAllIssues,
  getAllResolvedIssues,
  getAllUnresolvedIssues,
  getIssueById,
  addIssue,
  updateIssue,
  postComment,
  postSolution,
  toggleResolveStatus,
  toggleUpvote,
  toggleInappropriate,
  deleteIssue,
};
