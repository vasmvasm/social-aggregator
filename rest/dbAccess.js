var Tweets = require('./models/twitter');
var Trends = require('./models/trends');
var Users = require('./models/users');
var Follows = require('./models/follows');
var Promise = require('promise');

var mongoose = require('mongoose');

var db = mongoose.connection;

var logger = require("./logger.js");

var _ = require("underscore")


mongoose.connect('mongodb://localhost/play')


var exports = {
	getTweets:function(condition, skip,limit,callback){
		if(skip==undefined) {
			Tweets.find(condition).sort({timestamp_ms: -1}).limit(limit).exec(callback);
		}else{
			Tweets.find(condition).sort({timestamp_ms: -1}).skip(skip).limit(limit).exec(callback);
		}
	},
	getContent:function(condition,callback){
			Tweets.find(condition).select('content').exec(callback);
	},
	
	getDistinctForTweets:function(type,condition,callback){
			Tweets.distinct(type,condition,callback);
	},

	
	getUsers:function(condition,callback,sort){
		if(sort==undefined) {
			Users.find(condition).exec(callback);
		}else{
			Users.find(condition).sort(sort).exec(callback);
		}

	},

	getTrends: function(callback){
		var top_trends = [];
		var other_trends = [];
		var query = [];
		Trends.find().sort({retweet_count:-1}).exec(function(err,trends){
			trends.forEach(function(trend){
				if(trend.content!=undefined){
					if(trend.content=="Looks like we couldn't find the content. :("){
						return;
					}else{
						trend.content = "1";
					}
				}
				if(query.indexOf(trend.query)==-1){
					top_trends.push(trend);
					query.push(trend.query);
				}else{
					other_trends.push(trend);
				}
			});
			callback(top_trends.concat(other_trends));

		});
	},

	deleteUser: function(_id,callback){
		Users.find({_id: new mongoose.Types.ObjectId(_id)}).remove(function(err){
			if(err==null){
				exports.deleteFollows(_id,callback);
			}
		})
	},

	saveUsers:function(app,oldCategory,category,name,twitter_handle,insta_handle,profile_pic,followers,edit,callback){
		if(followers==undefined){
			followers = 0;
		}
		if(edit==false) {
			Users.find({
				twitter_handle: twitter_handle,
				app:app
			}).exec(function(err,user){
				if(user.length==0){
					var user = new Users({
						app:app,
						categories: [category],
						name: name,
						twitter_handle: twitter_handle,
						insta_handle:insta_handle,
						profile_pic: profile_pic,
						twitter_followers:followers
					});
					user.save(callback);
				}else{
					var index = user[0].categories.indexOf(category);
					if(index==-1){
						user[0].categories.push(category);
					}

					user[0].twitter_followers = followers;
					user[0].save(callback);
				}
			});


		}else{
			Users.find({_id: new mongoose.Types.ObjectId(edit)}).exec(function(err,user){
				if(user.length>0) {
					user[0].name = name;
					user[0].twitter_handle = twitter_handle;
					user[0].insta_handle = insta_handle;
					user[0].profile_pic = profile_pic;
					user[0].app = app;
					user[0].save(callback)
				}
			});
		}
	},


	getFollow_New:function(device_id,app,callback){
		Follows.find({device_id: device_id,app:app}, callback);
	},

	getFollowHandles_New:function(app,device_id,category,callback){
		var user_condition = {app:app};
		if(category!="all"){
			user_condition = {app:app,categories:category};
		}
		exports.getUsers(user_condition,function(err,users){
			logger.debug("fetched Users: "+ users.length);
			exports.getFollow_New(device_id, app, function(err,user_follows){
				if(user_follows!=undefined && user_follows.length>0){
					var twitter = [];
					var insta = [];
					var twitterMap = {};
					var instaMap = {};
					var follows = user_follows[0].follows;
					for(var ctr=0;ctr<follows.length;ctr++){
							users.forEach(function(user){
								if(user._id==follows[ctr]){
									if(user.twitter_handle!=undefined){
										twitter.push(user.twitter_handle);
										twitterMap[user.twitter_handle] = {id:follows[ctr],name:user.name};
									}
									if(user.insta_handle!=undefined) {
										insta.push(user.insta_handle);
										instaMap[user.insta_handle] = {id:follows[ctr],name:user.name};
									}
								}
							})
					};
					callback({twitter:twitter, insta:insta, twitterMap:twitterMap, instaMap: instaMap});
				}
			});
		})

	},

	removeCategories: function(edit,category,device){
		var categoryArr = device.categories[category];
		if(categoryArr==undefined){
			return;
		}
		var index = categoryArr.indexOf(edit);
		if(index>-1){
			if(categoryArr.length==1){
				delete device.categories[category];
			}else{
				categoryArr.splice(index,1);
			}
			device.markModified("categories");
			device.save();
		}
	},


	deleteFollows: function(_id,callback){
		Follows.find({},function(err,devices){
			for(var ctr=0;ctr<devices.length;ctr++){
				if(devices[ctr].follows!=null && devices[ctr].follows.length>0){
					var index = devices[ctr].follows.indexOf(_id);
					logger.debug(devices[ctr].device_id +": "+index);
					if(index>-1){
						devices[ctr].follows.splice(index,1);
						devices[ctr].save();
					}
				}
			}
			callback("done");
		})
	},

	saveAllFollows:function(app,device_id,doc,callback){
		var user_follow = new Follows({
			device_id:device_id,
			follows:doc,
			app:app
		})
		user_follow.save(callback);
	},

	saveFollow:function(app,device_id,id,follow,callback){
		exports.getFollow_New(device_id,app,function(err,user_follows){
			if(user_follows != null && user_follows.length>0){
				if(follow){
					logger.debug("in Follow");
					if(user_follows[0].follows.indexOf(id)==-1){
						user_follows[0].follows.push(id);
					}
				}else{
					var index = user_follows[0].follows.indexOf(id);
					logger.debug("in unFollow, index:"+index);
					if(index>-1){
						user_follows[0].follows.splice(index,1);
					}
				}
				user_follows[0].save(callback);
			}
		});

	},

	saveFollow_multiple:function(app,device_id,follow_json,callback){
		exports.getFollow_New(device_id,app,function(err,user_follows){
			if(user_follows != null && user_follows.length>0){
				var follow = JSON.parse(follow_json);
				if(_.isArray(follow)){
					for(var ctr=0;ctr<follow.length;ctr++){
						if(follow[ctr].follow){
							if(user_follows[0].follows.indexOf(follow[ctr].id)==-1){
								user_follows[0].follows.push(follow[ctr].id);
							}
						}else{
							var index = user_follows[0].follows.indexOf(follow[ctr].id);
							logger.debug("in unFollow, index:"+index);
							if(index>-1){
								user_follows[0].follows.splice(index,1);
							}
						}
					}
				}
				user_follows[0].save(callback);
			}
		});

	}
	
};
//function(doc){
//	var categoryMap = doc.categories;
//		var userCategory = [];
//		for(var category in categoryMap){
//			userCategory = userCategory.concat(categoryMap[category]);
//		}
//
//	db.follows.insert({device_id:doc.device_id, app:doc.app, follows:userCategory});
//}

module.exports = exports;
