const express = require("express");
const User = require("../models/user");
const router = express.Router();
const passport = require("passport");
const { redirectLogin } = require("../middleware");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

router.get("/register", (req, res) => {
  res.render("./auth/signup");
});

// signup
router.post("/register", async (req, res) => {
  try {
    const { username, password, email, isAdmin, fullName } = req.body;

    const user = new User({ username, email, isAdmin, fullName, password });
    const newUser = await User.register(user, password);
    bcrypt.hash(newUser.password, 10, function (err, hash) {
      if (err) throw err;
      newUser.password = hash;
      newUser.save().then((user) => {
        req.flash(
          "success",
          "Register Successfully! Please login to continue."
        );
        res.redirect("/login");
      });
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
});

// display login form to the user
router.get("/login", (req, res) => {
  res.render("./auth/login");
});

// login the user into the sessions
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureMessage: true,
  }),
  redirectLogin,
  (req, res) => {
    const { username } = req.user;

    req.flash("success", `Welcome back ${username}`);
    res.redirect("/products");
  }
);

// Logout the user from the session
router.get("/logout", (req, res) => {
  req.logout();

  req.flash("success", "You have logged out Successfully!!");
  res.redirect("/login");
});

// let user = {
//   id: "njkhadujhfihdihfas2",
//   email: "thienphucrt@gmail.com",
//   password: "phuctran1118",
// };
const JWT_SECRET = "superleystrongkey";
router.get("/forgot-password", (req, res, next) => {
  res.render("forgot-password");
});
router.post("/forgot-password", (req, res, next) => {
  const { email } = req.body;
  User.find({ email: email }, function (err, users) {
    if (err) {
      console.err(err);
      return;
    }
    console.log(users);
    if (users.length == 0) {
      res.send("User not registered");
      return;
    }

    //User exist and now create a One time link valid for 15 minutes
    users.forEach(function (user) {
      var secret = JWT_SECRET + user.password;
      var payload = {
        email: user.email,
        id: user.id,
      };
      console.log(payload);
      const token = jwt.sign(payload, secret, { expiresIn: "15m" });
      const link = `http://localhost:3000/reset-password/${user.id}/${token}`;
      console.log(link);
      res.send("Password reset link has been sent to your email...");
    });
  });
});
router.get("/reset-password/:id/:token", (req, res, next) => {
  const { id, token } = req.params;
  console.log("id", id);
  User.find({ _id: id }, function (err, users) {
    if (err) {
      console.err(err);
      return;
    }
    users.forEach(function (user) {
      const secret = JWT_SECRET + user.password;
      console.log("id2", user.id);
      console.log(user.password);
      if (id !== user.id) {
        res.send("Invalid id...");
        return;
      }
      try {
        const payload = jwt.verify(token, secret);
        console.log("email", user.email);
        res.render("reset-password", { email: user.email });
      } catch (error) {
        console.log(error.message);
        res.send("Not Verify");
      }
    });
  });
});
router.post("/reset-password/:id/:token", (req, res, next) => {
  const { id, token } = req.params;
  const { password, password2 } = req.body;
  User.find({ _id: id }, function (err, users) {
    if (err) {
      console.err(err);
      return;
    }
    users.forEach(function (user) {
      //validate password and password2 should match
      //we can simly find the user with the payload email and id and finally update with new password
      //alwasy hash the password
      user.password = password;
      res.send(user);
      if (id !== user.id) {
        res.send("User Not Exists!!!");
        return;
      }
      const secret = JWT_SECRET + user.password;
      try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = bcrypt.hash(password, 10);
        User.updateOne(
          {
            _id: id,
          },
          {
            $set: {
              password: encryptedPassword,
            },
          }
        );
        res.json({ status: "Passwords updated" });
      } catch (error) {
        console.log(error.message);
        res.send(error.message);
      }
    });
  });
});

module.exports = router;
