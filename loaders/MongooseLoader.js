const { connect, Connection } = require("mongoose");
const { MONGO } = require("../config");

/**
 * Creates a connection with MongoDB database
 * @returns {Connection} A connection to MongoDB database
 */
const getDatabaseConnection = async function () {
  const { connection } = await connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  return connection;
};

module.exports = getDatabaseConnection;
