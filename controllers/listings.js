const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});

    res.render("listings/index", { allListings });
    return;
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
    return;
}

module.exports.showListing = async(req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");

    res.render("listings/show", { listing })
    return;
}

module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;
    
    let { title, description, image, price, country, location } = req.body;

    let result = listingSchema.validate(req.body);
    console.log(result)
    if(result.error){
        throw new ExpressError(400, result.error);
    }

    const newListing = await new Listing({
        title: title,
        description: description,
        image: image,
        price: price,
        country: country,
        location: location,
        owner: req.user._id
    });

    newListing.image = { url, filename }

    await newListing.save();

    req.flash("success", "New Listing Created!");

    res.redirect("/listings");
    return;
}

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) throw new ExpressError(404, "Listing not found");

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImgaeUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit", { listing });
    return;
}

module.exports.updateListing = async (req, res) => {

    let url = req.file.path;
    let filename = req.file.filename;

    let{ id } = req.params;
    let { title, description, image, price, country, location } = req.body;

    listing = await Listing.findByIdAndUpdate(id, {
        title: title,
        description: description,
        image: image,
        price: price,
        country: country,
        location: location
    });

    if( typeof req.file !== "undefined"){
        listing.image = { url, filename }
        await listing.save();
    }

    req.flash("update", "Listing Updated!");

    res.redirect(`/listings/${id}`);
    return;
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);

    req.flash("failure", "Listing Deleted!");

    res.redirect("/listings");
    return;
}