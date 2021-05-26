const router = require("express").Router();

const {
  authHelper: { allowIfLoggedIn, hasAccessTo },
} = require("../misc/helpers");

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
