const router = require("express").Router();

const userService = require("../services/UserService");
const { saveCsv } = require("../services/FileService");

const {
  getOwnUserInfo,
  addUser,
  addUsersFromFile,
  updateOwnUserPassword,
  updateOwnUserProfile,
  deleteOwnUserProfile,
  getUserByUserId,
  getAllUsers,
  updateAnyUserProfileByUserId,
  deleteAnyUserByUserId,
} = require("../controllers/userController");

/*
 * GET USER INFO
 * [Only loggedIn user can see their info. The userID of loggedIn user is stored in the JWT token itself]
 */
router.get(
  "/",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("readOwn", "profile"),
  async (req, res) => getOwnUserInfo(req, res)
);

router.post(
  "/add",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("createAny", "profile"),
  async (req, res) => addUser(req, res)
);

router.post(
  "/add/bulk",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("createAny", "profile"),
  saveCsv,
  addUsersFromFile
);

router.patch(
  "/update/password",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("updateOwn", "profile"),
  async (req, res) => updateOwnUserPassword(req, res)
);

/*
 * USER: UPDATE PROFILE DETAILS
 * [firstName,lastName & department only]
 */
router.post(
  "/update/profile",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("updateOwn", "profile"),
  async (req, res) => updateOwnUserProfile(req, res)
);

/**
 * USER: DELETE OWN PROFILE.
 */
router.delete(
  "/",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("deleteOwn", "profile"),
  async (req, res) => deleteOwnUserProfile(req, res)
);

/**
 * AUTHORITY:GET ALL USERS.
 */
router.get(
  "/all",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("readAny", "profile"),
  async (req, res) => getAllUsers(req, res)
);

/**
 * AUTHORITY: GET USER BY USEID.
 */
router.get(
  "/:userId",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("readAny", "profile"),
  async (req, res) => getUserByUserId(req, res)
);

/*
 * AUTHORITY: UPDATE USER DETAILS [ALL]
 */
router.post(
  "/update/profile/:userID",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("updateAny", "profile"),
  async (req, res) => updateAnyUserProfileByUserId(req, res)
);

/**
 * AUTHORITY: DELETE A USER PROFILE [ALL]
 */
router.delete(
  "/:userID",
  userService.allowIfLoggedIn,
  userService.hasAccessTo("deleteAny", "profile"),
  async (req, res) => deleteAnyUserByUserId(req, res)
);

module.exports = router;
