const passport = require("passport");
// const JwtStrategy = require("passport-jwt").Strategy;
// const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/user");
module.exports = function (passport) {
  passport.serializeUser((user, done) => {
    done(null, {
      id: user.id,
      name: user.name,
      role: user.isAdmin === true ? "admin" : "user",
    });
  });

  passport.deserializeUser((data, done) => {
    User.findById(data.id, (error, user) => {
      if (error) {
        return done(error);
      }
      if (!user) {
        return done(null, false);
      }
      return done(null, {
        id: user.id,
        name: user.name,
        role: data.role,
      });
    });
  });
};
