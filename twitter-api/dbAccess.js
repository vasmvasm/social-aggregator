var Tweets = require('./models/twitter');
var Photos = require('./models/photos');
var Users = require('./models/users');
var User_Follow = require('./models/user_follow');
var Promise = require('promise');

var mongoose = require('mongoose');

var db = mongoose.connection;


// db.once('open', function callback () {
// 	console.log('We have connected to mongodb');
// });

mongoose.connect('mongodb://localhost/play')


var exports = {
	getTweets:function(condition,skip,limit,callback){
			Tweets.find(condition).sort({timestamp_ms:-1}).skip(skip).limit(limit).exec(callback);
	},
	getContent:function(condition,callback){
			Tweets.find(condition).select('content').exec(callback);
	},
	getPhotos:function(condition,skip,limit,callback){
            Photos.find(condition).sort({timestamp_ms:-1}).skip(skip).limit(limit).exec(callback);
    },
	
	getDistinctForTweets:function(type,condition,callback){
			Tweets.distinct(type,condition,callback);
	},

	getDistinctForInsta:function(type,condition,callback){
			Photos.distinct(type,condition,callback);
	},
	
	getUsers:function(condition,callback){
			Users.find(condition).exec(callback);
	},

	deleteUser: function(_id,callback){
		Users.find({_id: new mongoose.Types.ObjectId(_id)},function(err,user){
			if(user.length>0){
				user[0].remove(callback);
				exports.deleteFollows(user[0].twitter_handle);
			}
		})
	},

	saveUsers:function(app,oldCategory,category,name,twitter_handle,insta_handle,profile_pic,edit,callback){
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
						profile_pic: profile_pic
					});
					user.save(callback);
				}else{
					var index = user[0].categories.indexOf(category);
					if(index==-1){
						user[0].categories.push(category);
					}
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
					if(oldCategory!=category){
						var index = user[0].categories.indexOf(oldCategory);
						if(index>-1){
							user[0].categories.splice(index,1);
							exports.deleteFollows(edit,oldCategory);
						}
						if(category!=undefined && category!="") {
							user[0].categories.push(category);
						}
					}
					user[0].save(callback)
				}
			});
		}
	},

	getFollow:function(device_id,app,callback){
		User_Follow.find({device_id: device_id,app:app}, callback);
	},

	getFollowHandles:function(app,device_id,category,callback){
		exports.getUsers({app:app},function(err,users){
			exports.getFollow(device_id, app, function(err,user_follows){

				if(user_follows!=undefined && user_follows.length>0){
					var twitter = [];
					var insta = [];
					var twitterMap = {};
					var instaMap = {};
					var categories = {};
					if(category=="all"){
						categories = user_follows[0].categories;
					}else{
						if(user_follows[0].categories[category]!=undefined) {
							categories = {category: user_follows[0].categories[category]};
						}
					}
						for(var cat in categories){
							categories[cat].forEach(function(userid){
								users.forEach(function(user){
									if(user._id==userid){
										if(user.twitter_handle!=undefined){
											twitter.push(user.twitter_handle);
											twitterMap[user.twitter_handle] = userid;
										}
										if(user.insta_handle!=undefined) {
											insta.push(user.insta_handle);
											instaMap[user.insta_handle] = userid;
										}
									}
								})
							});
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


	deleteFollows: function(edit,handle_category){
		User_Follow.find({},function(err,devices){
			console.log(devices);
			for(var ctr=0;ctr<devices.length;ctr++){
				if(handle_category==null){
					for(var category in devices[ctr].categories){
						exports.removeCategories(edit,category,devices[ctr]);
					}
				}else{
					exports.removeCategories(edit,handle_category,devices[ctr]);
				}
			}
		})
	},

	saveAllFollows:function(app,device_id,doc,callback){
		var user_follow = new User_Follow({
			device_id:device_id,
			categories:doc,
			app:app
		})
		user_follow.save(callback);
	},

	saveFollow:function(app,device_id,id,follow, category,callback){
			User_Follow.find({app:app,device_id:device_id},function(err,result){
				if(follow==true){
					if(result.length==0){
						var categoryObj = {};
						categoryObj[category] = [id];
						var user_follow = new User_Follow({
							app:app,
							device_id:device_id,
							categories:categoryObj
						})
						user_follow.save(callback);
						return;
					}
					if(result[0].categories[category]==undefined){
						result[0].categories[category] = [];
					}
					result[0].categories[category].push(id);
				}else{
					if(result.length>0){
						var index = result[0].categories[category].indexOf(id);
						if(index>-1){
							result[0].categories[category].splice(index,1);
						}
					}
					
				}
				result[0].markModified('categories');
				result[0].save(callback);
			})
		
	}
	
};

module.exports = exports;
