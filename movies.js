var mongoose = require('mongoose');
var Schema = mongoose.Schema;
require('dotenv').config();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB, { useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

// Movie schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: true},
    releaseDate: Date,
    genre: {
        type: String,
        enum: [
            'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
        ]
    },
    actors: [{
        actorName: String,
        characterName: String,
    }],
    //imageUrl: String,
});

// Return the model of our server
module.exports = mongoose.model('Movie', MovieSchema);