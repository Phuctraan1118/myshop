const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You need to login first");
    return res.redirect("/login");
  }
  next();
};
const requireRole = (req, res, next) => {
  if (req.user && req.user.isAdmin === true) {
    next();
  } else {
    req.flash("error", "Access denied, your role is not admin");
    res.redirect("/products");
  }
};
const redirectLogin = (req, res, next) => {
  console.log(req.user);
  if (req.user && req.user.isAdmin === true) {
    req.flash("success", "Login successfull");
    res.redirect("/product/new");
  } else {
    req.flash("success", "Login successfull");
    res.redirect("/products");
  }
};

module.exports = {
  isLoggedIn,
  requireRole,
  redirectLogin,
};
