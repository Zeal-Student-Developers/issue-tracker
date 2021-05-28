const router = require("express").Router();

const {
  issueController: {
    getAllIssues,
    getAllIssuesByStatus,
    getIssueById,
    getIssuesByUser,
    getIssuesByPhrase,
    getComments,
    getSolutions,
    saveImagesController,
    addIssue,
    toggleResolveStatus,
    postComment,
    postSolution,
    toggleUpvote,
    toggleInappropriate,
    updateIssue,
    deleteIssue,
  },
} = require("../controllers");

const {
  authHelper: { allowIfLoggedIn, hasAccessTo },
} = require("../misc/helpers");

router.get(
  "/own",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getIssuesByUser
);

// Get all issues
router.get(
  "/all",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getAllIssues
);

// Get all issues by resolve status
router.get(
  "/status",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getAllIssuesByStatus
);

// Get issues by keywords
router.get(
  "/phrase",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getIssuesByPhrase
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
  saveImagesController
);

// Post an issue
router.post("/", allowIfLoggedIn, hasAccessTo("createOwn", "issue"), addIssue);

// Update an issue
router.put(
  "/:id/update",
  allowIfLoggedIn,
  hasAccessTo("updateOwn", "issue"),
  updateIssue
);

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

// Get comments for an issue
router.get(
  "/:id/comments",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getComments
);

// Post a comment on an issue
router.put(
  "/:id/comments",
  allowIfLoggedIn,
  hasAccessTo("createAny", "comment"),
  postComment
);

// Get comments for an issue
router.get(
  "/:id/solutions",
  allowIfLoggedIn,
  hasAccessTo("readAny", "issue"),
  getSolutions
);

// Post a solution on an issue
router.put(
  "/:id/solutions",
  allowIfLoggedIn,
  hasAccessTo("createOwn", "solution"),
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
