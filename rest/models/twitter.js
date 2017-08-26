var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var twitterSchema = mongoose.Schema({
		 name:String,
		 screen_name: String,
		 tweet: String,
		 retweet_count: String,
		 favorite_count: String,
	     category: [String],
		 timestamp_ms:Number,
         timestamp:String,
		 content:String ,
		 userId:String,
		 source:String
	
});

module.exports = mongoose.model('tweets', twitterSchema);
