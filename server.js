/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./users');
var Movie = require('./movies');
var Review = require('./reviews');
var mongoose = require('mongoose');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();
router.post('/signup', (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err) {
            if(err) {
                if(err.code === 11000)
                    return res.json({success:false, message: 'A user with that username already exits'});
                else
                    return res.json(err);
            }
            res.json({success: true, msg: 'Successfully created new user'});
        });
    }
});

router.post('/signin', (req, res) => {
    var userNew = new User();
    userNew.username = req.body.username
    userNew.password = req.body.password

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if(err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if(isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    .get(authJwtController.isAuthenticated, (req, res) => {
        Movie.find({}, (err, movies) => {
            if(err) {
                return res.status(500).json({error: 'Internal Server Error'});
            }
            // Return the list of movies
            return res.json(movies);
        })
    })
    .post(authJwtController.isAuthenticated, (req, res) => {
        // Ensure appropriate fields are in the request
        if(!req.body.title || !req.body.releaseDate || !req.body.genre || !req.body.actors) {
            res.json({success: false, msg: 'Please include title, releaseDate, genre and actors.'});
        }
        // If so, create a new movie and add to database
        else {
            var movie = new Movie();
            movie.title = req.body.title;
            movie.releaseDate = req.body.releaseDate;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            // Save the movie in the database
            movie.save(function(err) {
                if(err) {
                    if(err.code === 11000)
                        return res.json({success:false, message: 'A movie with that title already exits'});
                    else
                        return res.json(err);
                }
                res.json({success: true, msg: 'Successfully created new movie'});
            });
        }
    })
    .all((req, res) => {
        // Any other HTTP method
        // Returns a message stating that the HTTP method is unsupported
        res.status(405).send({message: 'HTTP method not supported'})
    });

router.route('/movies/:id')
    .get((req, res) => {
        const id = mongoose.Types.ObjectId(req.params.id);
        if(req.query.reviews === "true") {
            Movie.aggregate([
                {
                    $match: { _id: id }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'movieId',
                        as: 'reviews'
                    },
                },
                {
                    $addFields: {
                        average_rating: { $avg: '$reviews.rating' }
                    }
                },
                {
                    $sort: {average_rating: -1 }
                }
            ]).exec((err, movies) => {
                if(err) {
                    return res.status(500).json({error: 'Internal Server Error'});
                }
                res.json(movies)
            });
        } else {
            Movie.findOne({ _id: id }, (err, movie) => {
                if(err) {
                    return res.status(500).json({error: 'Internal Server Error'});
                }
                if(!movie) {
                    return res.status(404).json({error: 'Movie not found'});
                }
                // Return the movie
                return res.json(movie);
            })
        }
    })
    .delete(authJwtController.isAuthenticated, (req, res) => {
        const movieName = req.params.movieName;
        Movie.findOneAndDelete({_id: id}, (err, deletedMovie) => {
            if (err) {
                return res.status(500).json({error: 'Internal Server Error'});
            }
            if (!deletedMovie) {
                return res.status(404).json({error: 'Movie not found'});
            }
            // Return a success message
            return res.json({message: 'Movie deleted successfully', deletedMovie});
        })
    })
    .put(authJwtController.isAuthenticated, (req, res) => {
        // Ensure appropriate fields are in the request
        if(!req.body.title || !req.body.releaseDate || !req.body.genre || !req.body.actors) {
            res.json({success: false, msg: 'Please include title, releaseDate, genre and actors.'});
        }
        // If so, update the movie and save to database
        else {
            var movie = new Movie();
            movie.title = req.body.title;
            movie.releaseDate = req.body.releaseDate;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            Movie.findOneAndUpdate(
                { _id: id },
                { $set: req.body },
                { new: true },
                (err, movie) => {
                    if(!movie) {
                        return res.status(404).json({error: 'Movie not found'});
                    }
                    if(err) {
                        return res.status(500).json({error: 'Internal Server Error'});
                    }
                    // Return a success message
                    return res.json({message: 'Movie updated successfully', movie});
                }
            )
        }
    })
    .all((req, res) => {
        // Any other HTTP method
        // Returns a message stating that the HTTP method is unsupported
        res.status(405).send({message: 'HTTP method not supported'})
    });

router.route('/reviews')
    .get(authJwtController.isAuthenticated, (req, res) => {
        Review.find({}, (err, reviews) => {
            if(err) {
                return res.status(500).json({error: 'Internal Server Error'});
            }
            // Return the list of movies
            return res.json(reviews);
        })
    })
    .post(authJwtController.isAuthenticated, (req, res) => {
        const id = mongoose.Types.ObjectId(req.body.movieId);
        Movie.findOne({ _id: id }, (err, movie) => {
            if(!movie) {
                return res.status(404).json({error: "Movie not found"});
            }
            if(err) {
                return res.status(500).json({error: 'Internal Server Error'});
            } 
        })
        // Ensure appropriate fields are in the request
        if(!req.body.movieId || !req.body.username || !req.body.review || !req.body.rating) {
            res.json({success: false, msg: 'Please include movieId, username, review and rating.'});
        }
            // If so, create a new movie and add to database
        else {
            var review = new Review();
            review.movieId = req.body.movieId;
            review.username = req.body.username;
            review.review = req.body.review;
            review.rating = req.body.rating;
            // Save the review in the database
            review.save(function(err) {
                if(err) {
                    if(err.code === 11000)
                        return res.json(err);
                }
                res.json({success: true, msg: 'Successfully created a review'});
            })
        }
    })
    .all((req, res) => {
        // Any other HTTP method
        // Returns a message stating that the HTTP method is unsupported
        res.status(405).send({message: 'HTTP method not supported'})
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


