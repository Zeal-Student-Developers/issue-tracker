const router = require("express").Router();

const {
  loginController,
  refreshTokenController,
} = require("../controllers/authController");

/*
 * ROUTE TO LOGIN AND RETURN ACCESS TOKEN
 */
router.post("/login", async (req, res) => loginController(req, res));

/*
 * ROUTE TO REFRESH ACCESS TOKEN
 */
router.post("/refresh", async (req, res) => refreshTokenController(req, res));

module.exports = router;
