const router = require("express").Router();

const {
  authController: { loginController, refreshTokenController },
} = require("../controllers");

/*
 * ROUTE TO LOGIN AND RETURN ACCESS TOKEN
 */
router.post("/login", loginController);

/*
 * ROUTE TO REFRESH ACCESS TOKEN
 */
router.post("/refresh", refreshTokenController);

module.exports = router;
