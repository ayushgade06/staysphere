const Listing = require("../models/listing.js");
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");

// ---------------------------
// INDEX + CATEGORY FILTER
// ---------------------------
module.exports.index = async (req, res) => {
    const { category } = req.query;

    let filter = {};
    if (category) filter.category = category;

    const allListings = await Listing.find(filter);

    res.render("listings/index", { allListings, category });
};

// ---------------------------
// SEARCH
// ---------------------------
module.exports.searchListings = async (req, res) => {
    let search = req.query.q;

    const allListings = await Listing.find({
        $or: [
            { title: new RegExp(search, "i") },
            { location: new RegExp(search, "i") },
            { country: new RegExp(search, "i") }
        ]
    });

    res.render("listings/index", { allListings, category: null });
};

// ---------------------------
// NEW FORM
// ---------------------------
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};

// ---------------------------
// SHOW LISTING
// ---------------------------
module.exports.showListing = async (req, res) => {
    let { listingId } = req.params;

    const listing = await Listing.findById(listingId)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) throw new ExpressError(404, "Listing not found");

    res.render("listings/show", { listing });
};

// ---------------------------
// CREATE LISTING
// ---------------------------
module.exports.createListing = async (req, res) => {
    const { title, description, price, country, location, category, lat, lng } =
        req.body.listing;

    const listing = new Listing({
        title,
        description,
        price,
        country,
        location,
        category,
        geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
        },
        owner: req.user._id
    });

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await listing.save();
    req.flash("success", "Listing created!");
    res.redirect(`/listings/${listing._id}`);
};

// ---------------------------
// EDIT FORM
// ---------------------------
module.exports.renderEditForm = async (req, res) => {
    const { listingId } = req.params;

    const listing = await Listing.findById(listingId);
    if (!listing) throw new ExpressError(404, "Listing not found");

    let originalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");

    res.render("listings/edit", { listing, originalImageUrl });
};

// ---------------------------
// UPDATE LISTING
// ---------------------------
module.exports.updateListing = async (req, res) => {
    const { listingId } = req.params;

    const { title, description, price, country, location, category, lat, lng } =
        req.body.listing;

    const listing = await Listing.findByIdAndUpdate(
        listingId,
        {
            title,
            description,
            price,
            country,
            location,
            category,
            geometry: {
                type: "Point",
                coordinates: [Number(lng), Number(lat)]
            }
        },
        { new: true }
    );

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await listing.save();
    }

    req.flash("update", "Listing updated!");
    res.redirect(`/listings/${listingId}`);
};

// ---------------------------
// DELETE LISTING
// ---------------------------
module.exports.destroyListing = async (req, res) => {
    const { listingId } = req.params;

    await Listing.findByIdAndDelete(listingId);

    req.flash("failure", "Listing Deleted!");
    res.redirect("/listings");
};
