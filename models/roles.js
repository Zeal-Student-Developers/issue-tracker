const AccessControl = require("accesscontrol");
const ac = new AccessControl();

exports.roles = (() => {
  ac.grant("user")
    .readOwn("profile")
    .updateOwn("profile")
    .deleteOwn("profile")
    .readAny("issue")
    .createOwn("issue")
    .updateOwn("issue")
    .updateAny("issue")
    .deleteOwn("issue")
    .createAny("comment");

  ac.grant("moderator").extend("user").updateAny("issue").updateAny("profile");

  ac.grant("auth_level_one")
    .readOwn("profile")
    .updateOwn("profile")
    .updateOwn("issue")
    .deleteOwn("profile")
    .readAny("issue")
    .updateAny("issue")
    .createAny("comment")
    .createOwn("solution");

  ac.grant("auth_level_two")
    .extend("auth_level_one")
    .createAny("profile")
    .readAny("profile")
    .updateAny("profile")
    .deleteAny("profile");

  ac.grant("auth_level_three").extend("auth_level_two").readAny("stats");

  return ac;
})();
