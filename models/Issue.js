const { Schema, model } = require("mongoose");

const IssueSchema = new Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
  },
  description: {
    type: String,
    default: "",
  },
  section: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  scope: {
    type: String,
    required: true,
    enum: ["DEPARTMENT", "INSTITUTE"],
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
  isInappropriate: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  upvotes: {
    type: Number,
  },
  upvoters: {
    type: [Number],
  },
  comments: {
    type: [
      {
        comment: { type: String },
        createdOn: { type: Date, default: new Date().getTime() },
      },
    ],
  },
  solutions: {
    type: [
      {
        solution: {
          type: String,
          required: true,
        },
        postedBy: {
          type: Number,
          required: true,
        },
        postedOn: {
          type: Date,
          default: new Date().getTime(),
        },
      },
    ],
  },
  createdBy: {
    type: Number,
    required: true,
  },
  createdOn: {
    type: Date,
    default: new Date().getTime(),
  },
});

module.exports = model("Issue", IssueSchema);
