require("dotenv").config();

const config = {
  MONGO: process.env.MONGO,
  MONGO_DUMMY: process.env.MONGO_DUMMY,
  JWT_SECRET: process.env.SECRET,
  TOKEN_LIFE: process.env.TOKEN_LIFE,
  FILE_SERVER_URI: process.env.FILE_SERVER_URI,
};

module.exports = config;
