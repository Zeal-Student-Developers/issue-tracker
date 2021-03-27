const router = require("express").Router();

const { allowIfLoggedIn, hasAccessTo } = require("../services/UserService");
const { saveCsv } = require("../services/FileService");

const {
  addUser,
  addUsersFromFile,
  getOwnProfile,
  getUserById,
  getAllUsers,
  updateOwnPassword,
  updateOwnProfile,
  updateAnyUserById,
  deleteOwnProfile,
  deleteAnyUserById,
} = require("../controllers/userController");

/*
 * GET USER INFO
 * [Only loggedIn user can see their info. The userID of loggedIn user is stored in the JWT token itself]
 */
router.get(
  "/",
  allowIfLoggedIn,
  hasAccessTo("readOwn", "profile"),
  getOwnProfile
);

router.post(
  "/add",
  allowIfLoggedIn,
  hasAccessTo("createAny", "profile"),
  addUser
);

router.post(
  "/add/bulk",
  allowIfLoggedIn,
  hasAccessTo("createAny", "profile"),
  saveCsv,
  addUsersFromFile
);

router.patch(
  "/update/password",
  allowIfLoggedIn,
  hasAccessTo("updateOwn", "profile"),
  updateOwnPassword
);

/*
 * USER: UPDATE PROFILE DETAILS
 * [firstName,lastName & department only]
 */
router.post(
  "/update/profile",
  allowIfLoggedIn,
  hasAccessTo("updateOwn", "profile"),
  updateOwnProfile
);

/**
 * USER: DELETE OWN PROFILE.
 */
router.delete(
  "/",
  allowIfLoggedIn,
  hasAccessTo("deleteOwn", "profile"),
  deleteOwnProfile
);

/**
 * AUTHORITY:GET ALL USERS.
 */
router.get(
  "/all",
  allowIfLoggedIn,
  hasAccessTo("readAny", "profile"),
  getAllUsers
);

/**
 * AUTHORITY: GET USER BY USEID.
 */
router.get(
  "/:userId",
  allowIfLoggedIn,
  hasAccessTo("readAny", "profile"),
  getUserById
);

/*
 * AUTHORITY: UPDATE USER DETAILS [ALL]
 */
router.post(
  "/update/profile/:userID",
  allowIfLoggedIn,
  hasAccessTo("updateAny", "profile"),
  updateAnyUserById
);

/**
 * AUTHORITY: DELETE A USER PROFILE [ALL]
 */
router.delete(
  "/:userID",
  allowIfLoggedIn,
  hasAccessTo("deleteAny", "profile"),
  deleteAnyUserById
);

module.exports = router;
