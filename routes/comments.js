var express = require("express");
var router  = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments New
router.get("/new",middleware.isLoggedIn, function(req, res){
    // find campground by id
    // Campground.findById(req.params.id, function(err, campground){
    //     if(err){
    //         console.log(err);
    //     } else {
    //          res.render("comments/new", {campground: campground});
    //     }
    // })
    res.redirect("/campgrounds/" + req.params.id);
});

//Comments Create
router.post("/", middleware.isLoggedIn, middleware.checkIfCommented, function(req, res){
  Campground.findById(req.params.id).populate("comments", "rating").exec(function(err, campground){
       if(err){
        console.log(err);
        res.redirect("/campgrounds");
       } 
       else {
        Comment.create(req.body.comment, function(err, newComment){
           if(err){
               req.flash("error", "Something went wrong");
               console.log(err);
           } 
           else {
              //add username and id to comment
              newComment.author.id = req.user._id;
              newComment.author.username = req.user.username;
              newComment.campground = campground;
              //save comment
              newComment.save();
              campground.comments.push(newComment);
              // populate lets us use other collections by referencing the collections id inside another collection
              campground.avgRating = calcAvgRating(campground.comments);
              campground.save();
              req.flash("success", "Successfully added comment");
              res.redirect('/campgrounds/' + campground._id);
           }
        });
       }
   });
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
   Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err){
          res.redirect("back");
      } else {
        res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
      }
   });
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
  Comment.findByIdAndUpdate(req.params.comment_id, 
    { $set: 
      { 
        "text" : req.body.comment.text,
        "rating" : req.body.comment.rating 
      } 
    }, function(err, updatedComment){
    if(err){
      res.redirect("back");
    } else {
      Campground.findById(req.params.id).populate("comments", "rating").exec(function(err, foundCampground){
        if(err){
        console.log(err);
        res.redirect("/campgrounds");
       } else {
        foundCampground.avgRating = calcAvgRating(foundCampground.comments);
        foundCampground.save();
        req.flash("success", "Successfully updated comment");
        res.redirect("/campgrounds/" + req.params.id );
       }
      });
    }
  });
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
     if(err){
       res.redirect("back");
     } else {
      Campground.findByIdAndUpdate(req.params.id, 
      { 
        $pull: 
        { 
          comments: req.params.comment_id 
        } 
      }).populate("comments","rating").exec(function(err,updatedCampground) {
        if(err) {
          console.log(err);
          res.redirect("/campgrounds");
        } else {
          updatedCampground.avgRating = calcAvgRating(updatedCampground.comments);
          updatedCampground.save()
          req.flash("success", "Comment deleted");
          res.redirect("/campgrounds/" + req.params.id);
        }
      });
    }
  });
});

function calcAvgRating(collection) {
  if(collection.length === 0) {
    return 0;
  }
  var sum = 0;
  for(element of collection) {
    sum += element.rating;
  }
  return Math.floor(sum/collection.length);
}

module.exports = router;