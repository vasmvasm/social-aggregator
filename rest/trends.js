var mongoose = require('mongoose');

var request = require('request');
var oauth = {
	consumer_key: 'qRQin8RKSZzcqPYnjoY4ChKrw',
	consumer_secret: 'Vu0nTmWXt4VcxZT8wC0V8uysJov5BD4mKYyBohpmjEauh7PfPK',
	access_token_key: '2752538581-6tZ2EMJrBERHvXd2Bv17W2FIZRYsw4XpvAlPax2',
	access_token_secret: 'HWwe49yTUUd4v4JTxcrls3RicOJ76uXKrmdDRsLxz8kqP'
};

var nodeSchema = mongoose.Schema({
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

var trends_model = mongoose.model('trends', nodeSchema);
var db = mongoose.connection;
mongoose.connect('mongodb://localhost/play');

db.once('open', function callback () {
	trends_model.remove({},function(){
		var url = 'https://api.twitter.com/1.1/trends/place.json?id=23424848';
		request.get({url:url, oauth:oauth,json:true},function(error, response, body){
			body[0].trends.forEach(function(trend){
				(function(query){
					var searchUrl = 'https://api.twitter.com/1.1/search/tweets.json?q='+query+'&result_type=popular&count=5';
					request.get({url:searchUrl, oauth:oauth,json:true},function(e, r, b){
						b.statuses.forEach(function(tweetObj){
							(function(tweet){
								if(tweet.text!=null && tweet.in_reply_to_user_id==null && tweet.retweeted==false){
									var urls = (tweet.entities==null)?[]:tweet.entities.urls
									if(urls!=null&&urls.length>0){
										request.post({url:"http://52.24.20.66/readability/api/Readability.php",form:{pass:"irhs",url:urls[0].url}},
											function(e,doc){
												var newObj = new trends_model({
													name:tweet.user.name,
													screen_name: tweet.user.screen_name,
													tweet:tweet.text,
													retweet_count:tweet.retweet_count,
													favorite_count:tweet.favorite_count,
													total:tweet.retweet_count+tweet.favorite_count,
													timestamp_ms:tweet.timestamp_ms,
													tweetId:tweet.id_str,
													urls:tweet.entities.urls[0].url,
													profile_image_url:(tweet.user==undefined)?"":tweet.user.profile_image_url,
													media_url:(tweet.entities.media!=undefined&&tweet.entities.media.length>0)?tweet.entities.media[0].media_url:"",
													content:(doc==undefined)?"":doc.body,
													query:query,
													source:'twitter'
												});
												newObj.save();
											})
									}else{
										var newObj = new trends_model({
											name:tweet.user.name,
											screen_name: tweet.user.screen_name,
											tweet:tweet.text,
											retweet_count:tweet.retweet_count,
											favorite_count:tweet.favorite_count,
											timestamp_ms:tweet.timestamp_ms,
											tweetId:tweet.id_str,
											query:query,
											profile_image_url:(tweet.user==undefined)?"":tweet.user.profile_image_url,
											media_url:(tweet.entities.media!=undefined&&tweet.entities.media.length>0)?tweet.entities.media[0].media_url:"",
											source:'twitter'
										});
										newObj.save();
									}
								}
							})(tweetObj);
						});
					});
				})(trend.query);
			});
		});
	});
});

setTimeout(function(){
	db.close();
},60000);