var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var async = require("async");
var middleware = require("../middleware");


//INDEX - show all campgrounds
// include pagination 
router.get("/", function(req, res){
  var currentPage = parseInt(req.query.page) || 1; // set the page for campgrounds pagination
  var perPage = 4; // only let 4 campgrounds per page
  // Get all campgrounds from DB, set up pagination to 4 per page
  // skip - the campgrounds that are needed to be skip
  // limit - output only the num of perPage campgrounds
  // count - using count() to get the total num of campgrounds
  // pages - getting the num of pages
  // maxPagination - the amount of pagination not including currentPage
  Campground.find({}).skip((perPage * currentPage) - perPage).limit(perPage).exec(function(err,allCampgrounds) {
    Campground.countDocuments().exec(function(err,count) {
      if(err) {
        console.log(err);
      } else {
        res.render("campgrounds/index",
        {
          campgrounds : allCampgrounds,
          currentPage : currentPage,
          pages : Math.ceil(count/perPage),
          maxPagination : 4, 
        }
        );
      }
    });
  });
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newCampground = {name: name, image: image, description: desc, author:author}
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            res.redirect("/campgrounds");
        }
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id",middleware.checkCampgroundOwnership, function(req, res){
    // find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
       if(err){
           res.redirect("/campgrounds");
       } else {
           //redirect somewhere(show page)
           res.redirect("/campgrounds/" + req.params.id);
       }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership, function(req, res){
   Campground.findByIdAndRemove(req.params.id, async function(err,campground){
    if(err){
      res.redirect("/campgrounds");
    } else {
      await Comment.deleteMany(
        {_id: 
          { $in: campground.comments}
        }
      );
      res.redirect("/campgrounds");
    }
  });
});


module.exports = router;

