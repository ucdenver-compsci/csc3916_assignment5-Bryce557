var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
require('dotenv').config();

mongoose.Promise = global.Promise;
console.log(process.env.DB);
mongoose.connect(process.env.DB, { useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

// User schema
var UserSchema = new Schema({
    name: String,
    username: { type: String, required: true, index: { unique: true }},
    password: { type: String, required: true, select: false }
});

UserSchema.pre('save', function(next) {
    var user = this;
    // Hash the password
    if(!user.isModified('password')) return next();

    bcrypt.hash(user.password, null, null, function(err, hash) {
        if(err) return next(err);

        // Change the password
        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function(password, callback) {
    var user = this;
    // Compare clear password against hashed password
    bcrypt.compare(password, user.password, function(err, isMatch) {
        callback(isMatch);
    })
}

// Return the model of our server
module.exports = mongoose.model('User', UserSchema);