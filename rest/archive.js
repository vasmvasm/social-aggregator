var mongoose = require('mongoose');
const fs = require('fs');

var tweetSchema = mongoose.Schema({
		name:String,
		screen_name: String,
		tweet: String,
		retweet_count: Number,
		favorite_count: Number,
		timestamp_ms:Number,
    	tweetId:String,
		profile_image_url:String,
		media_url:String,
		urls:[String],
		content:String,
		source:String
});

var tweet_model = mongoose.model('tweets', tweetSchema);


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

var user_model = mongoose.model('users', UsersSchema);
var totalCount = 0;
var db = mongoose.connection;
var date = new Date();
date.setDate(date.getDate()-6);
date.setHours(0);
date.setMinutes(0);
date.setSeconds(0);
var printDate = date.getDate()+"-"+date.getMonth()+"-"+(date.getYear()+1900);


//function openFile(){
//	fs.open("/home/ubuntu/tweets-"+printDate+".json",'ax',function(err,fd){
//		console.log("File Open: "+ err);
//		function closeFile(){
//			fs.close(fd,function(err){
//				if(err==undefined){
//					console.log("File closed successfully");
//				}else{
//					console.log("Error while closing file: "+ err);
//				}
//			})
//		}
//		return closeFile;
//	});
//}

//var closeFile;

db.once('open', function callback () {

	fs.open("/home/ubuntu/tweets-"+printDate+".json",'ax',function(err,fd){
		console.log("File Open: "+ err);
	});

	user_model.find({}).exec(function(err,users){
		users.forEach(function(userObj){
			(function(user){
				var deleteIds = [];
				tweet_model.find({screen_name:{$in:[user.twitter_handle,user.insta_handle]},timestamp_ms:{$gt:date.getTime()}}).exec(function(err,tweets){
					if(err!=undefined){
						console.log(err);
						return;
					}
					if(tweets.length<10){
						tweet_model.find({screen_name:{$in:[user.twitter_handle,user.insta_handle]}}).sort({timestamp_ms:-1}).skip(10).exec(function(err,all_tweet){
							if(err!=undefined){
								console.log(err);
								return;
							}
							console.log(user.name +": "+all_tweet.length);
							fs.appendFile("/home/ubuntu/tweets-"+printDate+".json",all_tweet);
							all_tweet.forEach(function(tweet){
								deleteIds.push(tweet.tweetId);
							});
							totalCount += deleteIds.length;
							tweet_model.find({tweetId:{$in:deleteIds}}).remove(function(err){
								if(err!=undefined){
									console.log(err);
								}
							});

						});
					}else{
						tweet_model.find({screen_name:{$in:[user.twitter_handle,user.insta_handle]},timestamp_ms:{$lt:date.getTime()}}).exec(function(err,all_tweet){
							if(err!=undefined){
								console.log(err);
								return;
							}
							console.log(user.name +": "+all_tweet.length);
							fs.appendFile("/home/ubuntu/tweets-"+printDate+".json",all_tweet);
							all_tweet.forEach(function(all_tweet){
								deleteIds.push(all_tweet.tweetId);
							});
							totalCount += deleteIds.length;
							tweet_model.find({tweetId:{$in:deleteIds}}).remove(function(err){
								if(err!=undefined){
									console.log(err);
								}
							});
						})

					}
				});

			})(userObj);
		});
	});
  
});

mongoose.connect('mongodb://localhost/play');

setTimeout(function(){
	console.log("Total Ids Deleted: "+totalCount);
	db.close();
},120000);
