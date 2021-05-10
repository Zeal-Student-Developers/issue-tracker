const router = require("express").Router();

const {
  UserService: { allowIfLoggedIn, hasAccessTo },
} = require("../services");

const {
  statsController: { getIssueStats, getAuthorityStats },
} = require("../controllers");

router.get(
  "/issues",
  allowIfLoggedIn,
  hasAccessTo("readAny", "stats"),
  getIssueStats
);

router.get(
  "/authority",
  allowIfLoggedIn,
  hasAccessTo("readAny", "stats"),
  getAuthorityStats
);

module.exports = router;
