const router = require("express").Router();

const {
  getAllIssues,
  getAllResolvedIssues,
  getAllUnresolvedIssues,
  getIssueById,
  saveImages: saveImagesController,
  addIssue,
  toggleResolveStatus,
  postComment,
  postSolution,
  toggleUpvote,
  toggleInappropriate,
  deleteIssue,
} = require("../controllers/IssueController");
const { allowIfLoggedIn, hasAccessTo } = require("../services/UserService");
const { saveImages } = require("../services/FileService");

const Image = require("../models/Image");

// Get all issues
router.get(
  "/all",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getAllIssues
);

// Get all resolved issues
router.get(
  "/all/resolved",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getAllResolvedIssues
);

// Get all unresolved issues
router.get(
  "/all/unresolved",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getAllUnresolvedIssues
);

// Get issue by ID
router.get(
  "/:id",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getIssueById
);

// Post images for an issue
router.post(
  "/images",
  allowIfLoggedIn,
  hasAccessTo("createOwn", "issue"),
  saveImages,
  saveImagesController
);

// Post an issue
router.post("/", allowIfLoggedIn, hasAccessTo("createOwn", "issue"), addIssue);

// Update an issue
router.put("/:id/update", allowIfLoggedIn, hasAccessTo("updateOwn", "issue"));

// Mark an issue as resolved [Toggles the issue resolve status]
router.put(
  "/:id/resolve",
  allowIfLoggedIn,
  hasAccessTo("updateOwn", "issue"),
  toggleResolveStatus
);

// Mark an issue as inappropriate [Toggle]
router.put(
  "/:id/inappropriate",
  allowIfLoggedIn,
  hasAccessTo("updateAny", "issue"),
  toggleInappropriate
);

// Post a comment on an issue
router.put(
  ":id/comment",
  allowIfLoggedIn,
  hasAccessTo("createAny", "comment"),
  postComment
);

// Post a solution on an issue
router.put(
  "/:id/solution",
  allowIfLoggedIn,
  hasAccessTo("createAny", "solution"),
  postSolution
);

// Upvote an issue
router.put(
  "/:id/upvote",
  allowIfLoggedIn,
  hasAccessTo("updateAny", "issue"),
  toggleUpvote
);

// Delete an issue
router.delete(
  "/:id",
  allowIfLoggedIn,
  hasAccessTo("deleteOwn", "issue"),
  deleteIssue
);

module.exports = router;
