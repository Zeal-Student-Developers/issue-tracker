const { connect, Connection } = require("mongoose");
const { MONGO, ENV, MONGO_TEST } = require("../config");

/**
 * Creates a connection with MongoDB database
 * @returns {Connection} A connection to MongoDB database
 */
const getDatabaseConnection = async function () {
  const { connection } = await connect(ENV === "test" ? MONGO_TEST : MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  return connection;
};

module.exports = getDatabaseConnection;
