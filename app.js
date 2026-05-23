if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

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


const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, "public")));


const dbUrl = process.env.ATLAS_DB_URL || 'mongodb://127.0.0.1:27017/my-local-db';

async function main() {
    try {
        console.log('🔌 Attempting to connect to MongoDB Atlas...');
        await mongoose.connect(dbUrl, {
            ssl: true,
            tls: true,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true,
            retryWrites: true,
            w: 'majority',
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Database connection successful');
    } catch (err) {
        console.error('MongoDB Atlas connection failed:', err.message);
        console.log('Trying local MongoDB...');

        try {
            await mongoose.connect('mongodb://127.0.0.1:27017/my-local-db');
            console.log('Local MongoDB connection successful');
        } catch (localErr) {
            console.error('Local MongoDB also failed:', localErr.message);
            console.log('Continuing without database connection...');
        }
    }
}
main();


const secret = process.env.SECRET || 'thisshouldbeabettersecret';

let store;
try {
    store = MongoStore.create({
        mongoUrl: dbUrl,
        touchAfter: 24 * 3600,
        crypto: {
            secret
        }
    });

    store.on("error", function (e) {
        console.log("Session Store Error", e);
    });
} catch (err) {
    console.log("Session store creation failed, using memory store");
    store = undefined;
}

const sessionOptions = {
    store: store || undefined,
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
        maxAge: 1000 * 60 * 60 * 24 * 3,
        httpOnly: true
    }
};

app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    try {
        res.locals.success = req.flash("success");
        res.locals.failure = req.flash("failure");
        res.locals.update = req.flash("update");
        res.locals.currUser = req.user || null;
    } catch (err) {
        res.locals.success = [];
        res.locals.failure = [];
        res.locals.update = [];
        res.locals.currUser = null;
    }
    next();
});


app.use("/listings", listingsRouter);
app.use("/listings/:listingId/reviews", reviewsRouter);
app.use("/", userRouter);


app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    res.status(statusCode).render("error.ejs", { err });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
