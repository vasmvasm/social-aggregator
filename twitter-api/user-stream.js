var Stream = require('user-stream');
var mongoose = require('mongoose');

var request = require('request');


var stream = new Stream({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
});


var nodeSchema = mongoose.Schema({
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

var user_model = mongoose.model('tweets', nodeSchema);
var db = mongoose.connection;
db.once('open', function callback () {
   stream.stream();
  
});
mongoose.connect('mongodb://localhost/play');


var waitingTime = 5000;
var tcpErrorWaitTime = 250;

//listen stream data
stream.on('data', function(tweetObj) {
	if(tweetObj.text!=null && tweetObj.in_reply_to_user_id==null && tweetObj.retweeted==false){
		console.log(tweetObj);
	 	
		(function(tweet){
		 var urls = (tweetObj.entities==null)?[]:tweetObj.entities.urls
   		 if(urls!=null&&urls.length>0){
   			 request.post({url:"http://52.24.20.66/readability/api/Readability.php",form:{pass:"irhs",url:urls[0].url}},
   			 function(e,doc){
   				 var newObj = new user_model({
   					 name:tweet.user.name,
   					 screen_name: tweet.user.screen_name,
   					 tweet:tweet.text,
   					 retweet_count:tweet.retweet_count,
   					 favorite_count:tweet.favorite_count,
   					 timestamp_ms:tweet.timestamp_ms,
   			    	 tweetId:tweet.id_str,
   					 urls:tweet.entities.urls[0].url,
   					 profile_image_url:(tweet.user==undefined)?"":tweet.user.profile_image_url,
   					 media_url:(tweet.entities.media!=undefined&&tweet.entities.media.length>0)?tweet.entities.media[0].media_url:"",
   					 content:(doc==undefined)?"":doc.body,
   					 source:'twitter'
   				 });
   				 newObj.save();
   			 })
   		 }else{
   			 var newObj = new user_model({
   				 name:tweet.user.name,
   				 screen_name: tweet.user.screen_name,
   				 tweet:tweet.text,
   				 retweet_count:tweet.retweet_count,
   				 favorite_count:tweet.favorite_count,
   				 timestamp_ms:tweet.timestamp_ms,
   		    	 tweetId:tweet.id_str,
   				 profile_image_url:(tweet.user==undefined)?"":tweet.user.profile_image_url,
   				 media_url:(tweet.entities.media!=undefined&&tweet.entities.media.length>0)?tweet.entities.media[0].media_url:"",
   				 source:'twitter'
   			 });
   			 newObj.save();
   		 }
		})(tweetObj);
	}
});

stream.on('connected', function() {
	console.log("connected");
	waitingTime = 5000;
	tcpErrorWaitTime = 250;
});

stream.on('error', function(json) {
	console.log("******************************************Error************************************");	
	console.log(json);
	console.log(json.data.code);
	console.log("Time: "+ new Date());
	console.log("******************************************************************************");
	

	stream.destroy();	
	if(json.data!=null && json.data.code!=null){
		if(!isNaN(parseInt(json.data.code))){
			if(json.data.code==420){
				console.log("420------------> Danger"+ new Date());
				//Send Email.
			}else{
				if(waitingTime<=320000){
					setTimeout(function(){
						console.log("HTTP Error Retrying---"+ new Date());
						stream.stream();
					},waitingTime);
					waitingTime  = waitingTime*2;
				}else{
					console.log("Stopping retry"+ new Date());
					//Send Email.
				}
			}
		}else{
			if(tcpErrorWaitTime <=16000){
				setTimeout(function(){
					console.log("Network Error Retrying---"+ new Date());
					stream.stream();
				},tcpErrorWaitTime);
				tcpErrorWaitTime  += 250;
			}else{
				console.log("Stopping retry"+ new Date());
				//Send Email.
			}
		}
	}
	
});


stream.on('close', function(json) {
	console.log("******************************************Close************************************");	
		console.log(json);
		console.log("Time: "+ new Date());
	console.log("******************************************************************************");
	stream.destroy();
	stream.stream();
});
