if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const seedDB = require("./seed");
const productRoutes = require("./routes/productRoutes");
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes");
const methodoverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const authRoutes = require("./routes/authRoutes");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const passport = require("passport");
const cartRoutes = require("./routes/cartRoutes");

// connect the database
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("DB Connected!"))
  .catch((err) => {
    console.log("DB Not Connected");
    console.log(err);
  });

//set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(methodoverride("_method"));

// seed the database
// seedDB();

app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(flash());

//Initializing the passport and session for storing the user info

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(
  User.serializeUser((user, done) => {
    done(null, {
      id: user.id,
      name: user.name,
      role: user.isAdmin === true ? "admin" : "user",
    });
  })
);
passport.deserializeUser(
  User.deserializeUser((data, done) => {
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
  })
);

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.warning = req.flash("warning");
  res.locals.currUser = req.user;

  next();
});

app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.render("home");
});

app.use(forgotPasswordRoutes);
app.use(cartRoutes);
app.use(productRoutes);
app.use(authRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running at Port : 3000`);
});
