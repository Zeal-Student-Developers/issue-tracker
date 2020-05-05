const express = require("express");
const app = express();
const mongoose = require("mongoose");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose
    .connect(`${process.env.MONGO}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: true,
    })
    .then(() => console.log("Connected to mongodb"))
    .catch((err) => console.log(err));

const port = 3000;

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/api/auth/", require("./routes/auth"));
app.use("/api/users/", require("./routes/user"));

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
