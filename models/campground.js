var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   // need to put rating into comments to be able to delete the right rating when comment is deleted
   // change rating to campground rating
   // when deleting need to find commentID and delete
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
   avgRating: {
      type: Number,
      default: 0
   }
});

module.exports = mongoose.model("Campground", campgroundSchema);