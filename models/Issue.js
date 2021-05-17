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
  images: {
    type: [String],
    required: true,
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
    enum: ["DEPARTMENT", "ORGANIZATION"],
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
    type: [Schema.Types.ObjectId],
  },
  reporters: {
    type: [Schema.Types.ObjectId],
  },
  comments: {
    type: [
      {
        comment: {
          type: String,
          required: true,
        },
        postedBy: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        postedOn: {
          type: Date,
          default: new Date().getTime(),
        },
        isInappropriate: {
          type: Boolean,
          default: false,
        },
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
          type: Schema.Types.ObjectId,
          required: true,
        },
        postedOn: {
          type: Date,
          default: new Date().getTime(),
        },
        isInappropriate: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  createdOn: {
    type: Date,
    default: new Date().getTime(),
  },
});

IssueSchema.index({ title: "text", description: "text" });

module.exports = model("Issue", IssueSchema);
