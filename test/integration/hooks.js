require("dotenv").config();
const { connect } = require("mongoose");

const { User, Issue } = require("../../models");

const users = require("./data/users.json");
const issues = require("./data/issues.json");

before(function (done) {
  connect(process.env.MONGO_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
    .then(async ({ connection }) => {
      // Clear database
      await User.deleteMany();
      await Issue.deleteMany();

      // Create new database
      await User.insertMany(users);
      await Issue.insertMany(issues);

      await connection.close();

      done();
    })
    .catch((err) => {
      done(err);
    });
});
