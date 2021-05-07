const router = require("express").Router();

const {
  UserService: { allowIfLoggedIn, hasAccessTo },
} = require("../services");

const {
  statsController: { getIssueStats },
} = require("../controllers");

router.get(
  "/issues",
  allowIfLoggedIn,
  hasAccessTo("readAny", "stats"),
  getIssueStats
);

module.exports = router;
