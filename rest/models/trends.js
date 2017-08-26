var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var trendsSchema = mongoose.Schema({
	name:String,
	screen_name: String,
	tweet: String,
	retweet_count: Number,
	favorite_count: Number,
	total:Number,
	query:String,
	timestamp_ms:Number,
	tweetId:String,
	profile_image_url:String,
	media_url:String,
	urls:[String],
	content:String,
	source:String
});

module.exports = mongoose.model('trends', trendsSchema);
