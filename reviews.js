var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
require('dotenv').config();

mongoose.Promise = global.Promise;
console.log(process.env.DB);
mongoose.connect(process.env.DB, { useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

// Review schema
var ReviewSchema = new Schema({
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    username: String,
    review: String,
    rating: { type: Number, min: 0, max: 5 }
});

// Return the model of our server
module.exports = mongoose.model('Review', ReviewSchema);