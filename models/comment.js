var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    rating: Number,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    campground: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campground"
    }
});

module.exports = mongoose.model("Comment", commentSchema);