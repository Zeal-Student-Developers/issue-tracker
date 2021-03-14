const { Schema, model } = require("mongoose");

const ImageSchema = new Schema({
  path: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    requires: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  issueId: {
    type: Schema.Types.ObjectId,
  },
  createdOn: {
    type: Date,
    required: true,
  },
});

module.exports = model("Image", ImageSchema);
