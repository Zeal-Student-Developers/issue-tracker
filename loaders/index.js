const mongooseLoader = require("./MongooseLoader");
const expressLoader = require("./ExpressLoader");

/**
 * Initializes an Express server.
 * @returns An instance of Express Application & a connection to database
 */
const initializeServer = async function () {
  const connection = await mongooseLoader();
  console.log("Connected to MongoDB");
  const server = expressLoader();

  return { connection, server };
};

module.exports = initializeServer;
