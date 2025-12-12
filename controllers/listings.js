const Listing = require("../models/listing.js");
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.index = async (req, res) => {
    const { category } = req.query;
    
    let filter = {};
    if (category) {
        filter.category = category;
    }

    const allListings = await Listing.find(filter);

    res.render("listings/index", { allListings, category });
};


module.exports.searchListings = async (req, res) => {
    let search = req.query.q;

    const allListings = await Listing.find({
        $or: [
            { title: new RegExp(search, "i") },
            { location: new RegExp(search, "i") },
            { country: new RegExp(search, "i") }
        ]
    });

    res.render("listings/index", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
  return;
};

module.exports.showListing = async (req, res) => {
  let { listingId } = req.params;
  const listing = await Listing.findById(listingId)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");
  res.render("listings/show", { listing });
  return;
};

// module.exports.createListing = async (req, res) => {
//   let url = req.file.path;
//   let filename = req.file.filename;

//   let { title, description, image, price, country, location } = req.body;

//   let result = listingSchema.validate(req.body);
//   console.log(result);
//   if (result.error) {
//     throw new ExpressError(400, result.error);
//   }

//   const newListing = new Listing({
//     title,
//     description,
//     price,
//     country,
//     location,
//     category: req.body.listing.category, 
//     owner: req.user._id,
//     image: { url, filename },
//   });

//   newListing.geometry = {
//     type: "Point",
//     coordinates: [
//       parseFloat(req.body.lng), // longitude
//       parseFloat(req.body.lat), // latitude
//     ],
//   };

//   newListing.image = { url, filename };

//   await newListing.save();

//   req.flash("success", "New Listing Created!");

//   res.redirect("/listings");
//   return;
// };

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
        }
    });

    // For image from multer
    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    listing.owner = req.user._id;
    await listing.save();

    req.flash("success", "Listing created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  let { listingId } = req.params;
  const listing = await Listing.findById(listingId);

  if (!listing) throw new ExpressError(404, "Listing not found");

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit", { listing });
  return;
};

module.exports.updateListing = async (req, res) => {
  let url = req.file.path;
  let filename = req.file.filename;

  let { listingId } = req.params;
  let { title, description, image, price, country, location } = req.body;

  let listing = await Listing.findByIdAndUpdate(listingId, {
    title: title,
    description: description,
    image: image,
    price: price,
    country: country,
    location: location,
  });

  listing.geometry = {
    type: "Point",
    coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
  };

  if (typeof req.file !== "undefined") {
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("update", "Listing Updated!");

  res.redirect(`/listings/${listingId}`);
  return;
};

module.exports.destroyListing = async (req, res) => {
  let { listingId } = req.params;
  await Listing.findByIdAndDelete(listingId);

  req.flash("failure", "Listing Deleted!");

  res.redirect("/listings");
  return;
};
