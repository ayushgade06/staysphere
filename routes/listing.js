const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/wrapAsync.js');
const { isLoggedIn, isOwner, validateListing } = require('../middleware.js');
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// ⭐ Correct controller import
const listingController = require("../controllers/listings.js");

// ---------------------------
// INDEX + CREATE
// ---------------------------
router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );

// ---------------------------
// NEW FORM
// ---------------------------
router.get("/new", isLoggedIn, listingController.renderNewForm);

// ---------------------------
// SEARCH (FIXED NAME)
// ---------------------------
router.get("/search", wrapAsync(listingController.searchListings));

// ---------------------------
// SHOW + UPDATE + DELETE
// ---------------------------
router
    .route("/:listingId")
    .get(wrapAsync(listingController.showListing))
    .patch(
        isLoggedIn,
        isOwner,
        upload.single("image"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

// ---------------------------
// EDIT FORM
// ---------------------------
router.get("/:listingId/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;
