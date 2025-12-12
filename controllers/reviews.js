const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
    let { listingId } = req.params;
    let listing = await Listing.findById(listingId);

    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await Listing.findByIdAndUpdate(listingId, {
        $push: { reviews: newReview._id }
    });


    req.flash("success", "New Review Created!");

    res.redirect(`/listings/${listing.id}`);
    return;
};

module.exports.destroyReview = async (req, res) => {
    let { listingId, reviewId } = req.params;

    await Listing.findByIdAndUpdate(listingId, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);

    req.flash("failure", "Review Deleted!");

    res.redirect(`/listings/${listingId}`);
    return;
};