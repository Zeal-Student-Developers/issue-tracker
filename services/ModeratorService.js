const axios = require("axios").default;

const { MODERATOR_API_BASE_URI, MODERATOR_API_KEY } = require("../config");
const {
  helpers: {
    moderatorHelper: { combineStrings },
  },
} = require("../misc");

/** Threshold value to determine if screening detects NSFW content */
const NSFW_PROBABILITY_THRESHOLD = 0.7;

class ModeratorService {
  constructor() {}

  /**
   * Screens text for any NSFW content
   * @param  {...String} strings An array consisting of strings to screen
   * @returns {Promise<Boolean>} Whether the input contains NSFW content
   */
  async hasNSFWText(...strings) {
    // TODO: modify to allow strings more than 1024 characters to be
    // screened for NSFW content
    const text = combineStrings(strings).substr(0, 1024);

    try {
      const { status, data } = await axios.post(
        `${MODERATOR_API_BASE_URI}/contentmoderator/moderate/v1.0/ProcessText/Screen?classify=true`,
        text,
        {
          headers: {
            "Content-Type": "text/plain",
            "Ocp-Apim-Subscription-Key": MODERATOR_API_KEY,
          },
        }
      );

      if (status !== 200) throw new Error("Text Screening Failed");

      const {
        Classification: { Category1, Category2, Category3 },
      } = data;

      return (
        Category1.Score > NSFW_PROBABILITY_THRESHOLD ||
        Category2.Score > NSFW_PROBABILITY_THRESHOLD ||
        Category3.Score > NSFW_PROBABILITY_THRESHOLD
      );
    } catch (error) {
      throw new Error("Text Screening Failed");
    }
  }
}

module.exports = new ModeratorService();
