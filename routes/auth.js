const router = require("express").Router();

const {
  loginController,
  refreshTokenController,
} = require("../controllers/authController");

/*
 * ROUTE TO LOGIN AND RETURN ACCESS TOKEN
 */
router.post("/login", loginController);

/*
 * ROUTE TO REFRESH ACCESS TOKEN
 */
router.post("/refresh", refreshTokenController);

module.exports = router;
