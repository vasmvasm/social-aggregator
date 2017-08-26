var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var UsersSchema = mongoose.Schema({
	name:String,
	twitter_handle:String,
	insta_handle:String,
	categories:[String],
	profile_pic:String,
	app:String,
	twitter_followers:Number,
	default:Number
});

module.exports = mongoose.model('users', UsersSchema);

