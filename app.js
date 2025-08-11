// Load environment variables in development
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// ====== Imports ======
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const wrapAsync = require('./utils/wrapAsync.js');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

// Routers
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// ====== View Engine & Middleware ======
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "public")));

// ====== Database Connection ======
const dbUrl = process.env.ATLAS_DB_URL || 'mongodb://127.0.0.1:27017/my-local-db';

async function main() {
    await mongoose.connect(dbUrl);
}
main()
    .then(() => console.log('✅ Database connection successful'))
    .catch(err => console.error('❌ Database connection error:', err));

// ====== Session Store ======
const secret = process.env.SECRET || 'thisshouldbeabettersecret';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 3600, // time period in seconds
    crypto: {
        secret
    }
});

store.on("error", function (e) {
    console.log("❌ Session Store Error", e);
});

const sessionOptions = {
    store,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 3, // 3 days
        maxAge: 1000 * 60 * 60 * 24 * 3,
        httpOnly: true
    }
};

app.use(session(sessionOptions));
app.use(flash());

// ====== Passport Auth ======
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ====== Global Variables Middleware ======
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.failure = req.flash("failure");
    res.locals.update = req.flash("update");
    res.locals.currUser = req.user;
    next();
});

// ====== Routes ======
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

// ====== Error Handling ======
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    res.status(statusCode).render("error.ejs", { err });
});

// ====== Server Start ======
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
