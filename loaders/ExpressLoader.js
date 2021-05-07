const Express = require("express");
const cors = require("cors");

const { Error } = require("../models");

const {
  JwtService: { verify },
  UserService: { getUserById },
} = require("../services");

const {
  authRoutes,
  userRoutes,
  issueRoutes,
  statsRoutes,
} = require("../routes");

/**
 * Express middleware to verify the JWT token passed in the `authorization`
 * header of the request & load the respective user.
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express NextFunction
 */
const loadUser = async function verifyTokenAndLoadUser(req, res, next) {
  if (req.headers["authorization"]) {
    const accessToken = req.headers["authorization"];
    try {
      const { userID } = verify(accessToken);
      res.locals.loggedInUser = await getUserById(userID);
    } catch (error) {
      return res.status(401).json(new Error("BAD_REQUEST", error.message));
    }
  }
  next();
};

/**
 * Creates & initializes an instance of Express Application
 * @returns {Express.Application} An express application instance
 */
const getExpressApp = function () {
  const app = Express();

  app.use(Express.json());
  app.use(cors());

  app.get("/api", (_, res) => {
    res.status(200).json({
      code: "OK",
      result: "SUCCESS",
      message:
        "Grievance System API —— Read the API documentation here: https://github.com/Zeal-Student-Developers/issue-tracker/blob/master/Documentation.md",
    });
  });

  app.use("/api/auth/", authRoutes);

  // For auth routes, no need to load user
  app.use(loadUser);
  app.use("/api/users/", userRoutes);
  app.use("/api/issues/", issueRoutes);
  app.use("/api/stats/", statsRoutes);

  // Request to any route other than the above must result in `404` error
  app.use((_, res, next) => {
    res
      .status(404)
      .send(new Error("NOT_FOUND", "The endpoint you requested was not found"));
    next();
  });

  return app;
};

module.exports = getExpressApp;
