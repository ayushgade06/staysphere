const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const ExpressError = require('../utils/ExpressError.js');
const { listingSchema } = require('../schema.js');
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const listingController = require("../controllers/listings.js")

// Index and create routes
router 
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, upload.single("image"), validateListing, wrapAsync(listingController.createListing));

// New listing form route
router.get("/new", isLoggedIn, listingController.renderNewForm);

// Show, update, and delete specific listing routes
router
    .route("/:listingId")
    .get(wrapAsync(listingController.showListing))
    .patch(isLoggedIn, isOwner, upload.single("image"), validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// Edit listing form route
router.get("/:listingId/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;