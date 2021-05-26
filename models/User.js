const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: [
      "user",
      "moderator",
      "auth_level_one",
      "auth_level_two",
      "auth_level_three",
    ],
    required: true,
  },
  violations: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  refreshToken: {
    type: String,
    unique: true,
  },
});

module.exports = mongoose.model("User", UserSchema);
