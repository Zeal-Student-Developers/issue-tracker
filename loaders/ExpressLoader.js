const Express = require("express");
const cors = require("cors");

const { APIError } = require("../models");

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
const {
  helpers: { logging },
} = require("../misc");

/**
 * Express middleware to verify the JWT token passed in the `authorization`
 * header of the request & load the respective user.
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express NextFunction
 */
const loadUser = async function verifyTokenAndLoadUser(req, res, next) {
  try {
    if (req.headers["authorization"]) {
      const accessToken = req.headers["authorization"];
      let userID = null;
      try {
        userID = verify(accessToken).userID;
      } catch (error) {
        throw new APIError(
          APIError.BAD_REQUEST,
          "Please provide a correct JWT token"
        );
      }
      res.locals.loggedInUser = await getUserById(userID);
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Express middleware to handle any errors occured while processing
 * API requests
 * @param {Request} req Request Object
 * @param {Response} res Response Object
 * @param {Express.NextFunction} next Express NextFunction
 */
const errorHandler = (error, _, res, next) => {
  if (error) {
    let status = 500;
    let errorResponse = {
      code: "INTERNAL_SERVER_ERROR",
      result: "FAILURE",
      error: error.message,
    };

    if (error instanceof APIError) {
      const { code, statusCode, message } = error;

      status = statusCode;
      errorResponse = {
        code,
        result: "FAILURE",
        error: message,
      };
    } else if (error.name === "MongoError" && error.code === 11000) {
      // Duplicate key error
      status = 400;
      errorResponse = {
        code: "BAD_REQUEST",
        result: "FAILURE",
        error: `${Object.keys(error.keyPattern)[0]} already exists`,
      };
    } else if (error.name === "CastError" && error.kind === "ObjectId") {
      // Cast to MongoDb ObjectId failed
      status = 400;
      errorResponse = {
        code: "BAD_REQUEST",
        result: "FAILURE",
        error: "Please provide a valid ID",
      };
    }

    res.status(status).json(errorResponse);
  } else next();
};

/**
 * Creates & initializes an instance of Express Application
 * @returns {Express.Application} An express application instance
 */
const getExpressApp = function () {
  const app = Express();

  app.use(Express.json());
  app.use(cors());

  // app.use(logging);

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
  app.use((req, _, __) => {
    console.error("Requested endpoint:", req.url);
    throw new APIError(
      APIError.NOT_FOUND,
      "The endpoint you requested was not found"
    );
  });

  app.use(errorHandler);

  return app;
};

module.exports = getExpressApp;
