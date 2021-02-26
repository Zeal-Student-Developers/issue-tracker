const express = require("express");
const app = express();
const mongoose = require("mongoose");
const JwtService = require("./services/JwtService");
const UserService = require("./services/UserService");
const Error = require("./models/Error");
require("dotenv").config();

app.use(express.json());

mongoose
  .connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Connected to mongodb"))
  .catch((err) => console.log(err));

const port = 3000;

// Adds the loggedIn user to the response's local vars for easy access to
// other routes.
app.use(async (req, res, next) => {
  if (req.headers["authorization"]) {
    const accessToken = req.headers["authorization"];
    try {
      const { userID } = JwtService.verify(accessToken);
      res.locals.loggedInUser = await UserService.getUser(userID);
      next();
    } catch (error) {
      return res.status(401).json(new Error("BAD_REQUEST", error.message));
    }
  } else {
    next();
  }
});

app.use("/api/auth/", require("./routes/auth"));
app.use("/api/users/", require("./routes/user"));
app.use("/api/issues/", require("./routes/issue"));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
