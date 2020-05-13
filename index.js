const express = require("express");
const app = express();
const mongoose = require("mongoose");

app.use(express.urlencoded({ extended: true }));
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

app.get("/", async (req, res) => {
    //! Only for testing
    try {
        const users = await require("./services/UserService").getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json(error);
    }
});

app.use("/api/auth/", require("./routes/auth"));
app.use("/api/users/", require("./routes/user"));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
