const multer = require("multer");
const axios = require("axios").default;
const FormData = require("form-data");
const { unlinkSync, createReadStream } = require("fs");
const { extname } = require("path");
const { randomBytes } = require("crypto");

const { FILE_SERVER_URI } = require("../config");

const Image = require("../models/Image");

/** Maximum image count */
const MAX_IMAGE_COUNT = 3;
/** Destination for storing images */
const IMAGE_DESTINATION = "./images";

/** Multer Storage Engine, configured to store files locally at `IMAGE_DESTINATION` */
const storage = multer.diskStorage({
  destination: IMAGE_DESTINATION,
  filename: (_, { originalname }, cb) => {
    cb(null, `${randomBytes(35).toString("hex")}${extname(originalname)}`);
  },
});

/**
 * Express middleware for storing images on local storage. Saves at max
 * `MAX_IMAGE_COUNT` files
 */
const saveImages = multer({
  storage: storage,
}).array("images", MAX_IMAGE_COUNT);

/**
 * Express middleware for storing csv containing user details on local
 * storage.
 */
const saveCsv = multer({
  storage: storage,
}).single("users");

/**
 * Uploads given images to remote server
 * @param {Express.Multer.File[]} images images to be uploaded
 * @param {String} userId ID of the user storing the files
 */
const uploadImages = async (images, userId) => {
  const form = new FormData();
  form.append("userId", userId);
  images.forEach(({ path }) => form.append("images", createReadStream(path)));

  try {
    const response = await axios.post(`${FILE_SERVER_URI}/image`, form, {
      headers: form.getHeaders(),
    });

    const { data, status } = response;
    if (status === 200) {
      return data;
    }
    return null;
  } catch (error) {
    throw error;
  } finally {
    images.forEach(({ path }) => unlinkSync(path));
  }
};

/**
 * Set issueId of the images with given paths
 * @param {String[]} images Paths of images
 * @param {String} issueId ID of the issue
 */
const updateImageIssueId = async (images, issueId) => {
  await Image.updateMany(
    {
      path: { $in: images },
    },
    {
      issueId: issueId,
    }
  );
};

module.exports = { saveImages, uploadImages, updateImageIssueId, saveCsv };
