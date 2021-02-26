class Solution {
  constructor(userID, solution) {
    this.postedBy = userID;
    this.solution = solution;
    this.postedOn = new Date().toLocaleString();
  }
}

module.exports = Solution;
