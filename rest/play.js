var express = require('express'),
   http = require('http'),
	https = require('https'),
  fs = require('fs'),
   path = require('path');
  var ejs = require('ejs');
var Promise = require('promise');
  var request = require("request");
  var cookie = require('cookie');
  
  var cookieParser = require('cookie-parser');
  var faviconExpress = require("serve-favicon");
  var sessionExpress = require("cookie-session");
  var loggerExpress = require("morgan");
  var bodyParserExpress = require("body-parser");
  var methodOverrideExpress = require("method-override");
  var staticExpress = require("serve-static");
  var compress = require('compression')();
  
  
  
    var connect = require('connect');
	
	var db = require('./dbAccess');

var util = require('./util');

var ObjectId = require('mongoose').Types.ObjectId;

var app = express();

var logger = require("./logger.js");


  app.set('port', process.env.PORT || 10080);
  app.set('proj_dir', process.env.PROJ_DIR);
  app.set('views', __dirname + '/views');
  app.engine('html',ejs.renderFile);
  app.set('view engine','html');
  app.use(cookieParser());
  app.use(sessionExpress({secret: '1234567890'}));


  app.use(loggerExpress('dev'));
  app.use(bodyParserExpress());
  app.use(methodOverrideExpress());
  app.use(compress);

  app.use(staticExpress(path.join(__dirname, 'public')));

app.use(function(req,res,next) {
	process.on('uncaughtException', function (err) {
		res.write("Internal Server Error");
		res.end();
		logger.error(err);
	});
	next();
});



function getApps(){
	var p = new Promise(function(resolve, reject){
		db.getUsers({},function(err,docs){
			var response = [];
			for(var ctr=0;ctr<docs.length;ctr++){
				var app = docs[ctr].app;
				if(response.indexOf(app)==-1){
					response.push(app);
				}
			}
			resolve(response);
		});
	})
	return p;
}

function getCategories(app){
	var p = new Promise(function(resolve, reject){
		db.getUsers({app:app},function(err,docs){
			var response = [];
			for(var ctr=0;ctr<docs.length;ctr++){
				var categories = docs[ctr].categories;

				for(var cctr=0;cctr<categories.length;cctr++){
					if(response.indexOf(categories[cctr])==-1){
						response.push(categories[cctr]);
					}
				}
			}
			resolve(response);
		});
	})
	return p;
}






function fetchTweets(follows, twitterMap, instaMap,timestamp,limit,urlRegex,skip){
	logger.debug("follows:  " + follows);
	if(follows.length==0){
		var promise = new Promise(function(resolve,reject){
			resolve([]);
		})
		return promise;
	}

	var p = new Promise(function(resolve,reject){
		var condition = {
			screen_name: {$in: follows},
			content: {$ne: "Looks like we couldn't find the content. :("},
			content: {$not: /update your browser/i}
		};
		if(timestamp!=undefined) {
			skip = null;
			if (timestamp != 0) {
				condition = {
					timestamp_ms: {$lt: timestamp},
					screen_name: {$in: follows},
					content: {$ne: "Looks like we couldn't find the content. :("}
				};
			}
		}
		db.getTweets(condition, skip,limit,function(err,docs){
			logger.debug("Fetched Tweets");
			if(docs==undefined){
				resolve([]);
				return;
			}

			var responseDoc = [];
			for(var ctr=0;ctr<docs.length;ctr++){
				if(follows.indexOf(docs[ctr].screen_name)==-1){
					continue;
				}
				var timediff = new Date().getTime()-docs[ctr].timestamp_ms;
				if(docs[ctr].source=="insta"){
					var timediff = new Date().getTime()-(docs[ctr].timestamp_ms*1000);
				}

				var diffDate = new Date(timediff);

				var diffStr = "";
				if(timediff<60000){
					diffStr = "just now"
				}else if(diffDate.getMonth()>0){
					diffStr += (diffDate.getMonth()) + "month ago"
				}
				else if(diffDate.getDate()>1){
					diffStr += (diffDate.getDate()-1) + "day ago"
				}
				else if(diffDate.getHours()>0){
					diffStr += diffDate.getHours() + "hr ago"
				}
				else if(diffDate.getMinutes()>0){
					diffStr += diffDate.getMinutes() + "min ago"
				}


				if(docs[ctr].content!=undefined){
					if(docs[ctr].content=="Looks like we couldn't find the content. :("){
						continue;
					}else{
						docs[ctr].content = "1";
					}
				}
				docs[ctr].tweet = docs[ctr].tweet.replace(urlRegex,'');
				docs[ctr].timestamp= diffStr;
				if(docs[ctr].source=="twitter"){
					docs[ctr].userId = twitterMap[docs[ctr].screen_name].id;
					docs[ctr].name = twitterMap[docs[ctr].screen_name].name;
				}else if(docs[ctr].source=="insta"){
					if(instaMap[docs[ctr].screen_name]==undefined){
						continue;
					}
					docs[ctr].userId = instaMap[docs[ctr].screen_name].id;
					docs[ctr].name = instaMap[docs[ctr].screen_name].name;
				}
				responseDoc.push(docs[ctr]);
			}
			resolve(responseDoc);
		});
	});

	return p;
}


function saveFile(fileName, path){

	var dir = "";
	if(app.get("proj_dir")!=undefined){
		dir = process.env.PROJ_DIR;
	}
	console.log("DIR: "+dir);
	var file = fs.createWriteStream(dir+'public/images/'+fileName);
	request.get(path).pipe(file);

	file = fs.createWriteStream(dir+'public/images/'+fileName+"_bigger");
	path = path.replace('_normal','');
	console.log(path);
	request.get(path).pipe(file);


}

/*
* fetch timeline data from both twitter and instagram
*
* * @category
 * @skip
 * @limit
 * @device_id
* */
  app.get('/fetch',function(req,res){
	  var urlRegex =/\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/ig;
	  if(req.query.imagesOnly=="true"){
		  condition.media_url = {$ne:""}
	  }

	  logger.debug("In fetch");

	  db.getFollowHandles_New(req.query.app,req.query.device_id,req.query.category,function(result){
		  logger.debug("Fetched handles");
		  var follows = [];
		  fetchTweets(util.concat(result.twitter,result.insta),result.twitterMap, result.instaMap,req.query.timestamp,req.query.limit,urlRegex,req.query.skip).then(function(responseDoc){
			  res.contentType('application/json');
			  res.write(JSON.stringify(responseDoc));
			  res.end();
		  });
      });
  });


app.get('/fetchProfile',function(req,res){
	var urlRegex =/\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/ig;
	if(req.query.imagesOnly=="true"){
		condition.media_url = {$ne:""}
	}

	db.getUsers({_id:new ObjectId(req.query.userId)},function(err,user){
		var twitterMap = {},instaMap = {};
		var follows = [];
		if(user[0].twitter_handle!=undefined){
			follows.push(user[0].twitter_handle)
			twitterMap[user[0].twitter_handle] = req.query.userId;
		}
		if(user[0].insta_handle!=undefined){
			follows.push(user[0].insta_handle)
			instaMap[user[0].insta_handle] = req.query.userId;
		}
		fetchTweets(follows,twitterMap, instaMap,req.query.timestamp,req.query.limit,urlRegex,req.query.skip).then(function(responseDoc){
			res.contentType('application/json');
			res.write(JSON.stringify(responseDoc));
			res.end();
		});
	});
});


/*
 * fetch twitter Trends
 *
 * */
app.get('/fetchTrends',function(req,res){
	db.getTrends(function(docs){
		res.contentType('application/json');
		res.write(JSON.stringify(docs));
		res.end();
	});
});

/*
* fetch readibility content for a particulat tweet
 *
 * @tweetId
* */
  app.get('/fetchContent',function(req,res){
      db.getContent({tweetId:req.query.tweetId},function(err,docs){
              res.contentType('text/html');
              res.write((docs!=undefined && docs.length>0 && docs[0].content!=undefined)?docs[0].content:"No Content");
              res.end();
      });
  });


/*
* save whether a device_id follows a user
*
* @device_id
* @id: userid
* @follow: true/false
* @category: which category the user belongs to
* */
  
  app.post('/saveFollow',function(req,res){
	  db.saveFollow(req.body.app,req.body.device_id,req.body.id,req.body.follow,function(err){
		  if(err==undefined){
		  	 res.write("success")	
		  }
		  res.end();
	  });
  });


app.post('/saveFollowBulk',function(req,res){
	console.log(req.body);
	db.saveFollow_multiple(req.body.app,req.body.device_id,req.body.follow_json,function(err){
		if(err==undefined){
			res.write("success")
		}
		res.end();
	});
});

/*
* Add/update user from admin page
*
* @oldCategory
* @category
* @name: User name
* @twitter_handle
* @insta_handle
* @profile_pic
* @edit: either contains userid to edit or false(which means its an Add case)
* */

app.post('/saveUsers',function(req,res){
	db.saveUsers(req.body.app,req.body.oldCategory,req.body.category,req.body.name,req.body.twitter_handle,req.body.insta_handle,req.body.profile_pic,req.body.followers,req.body.edit,function(err,doc){
		if(err==undefined){
			saveFile(doc._id,req.body.profile_pic);
			res.write("success")
		}
		res.end();
	});
});

/*
* Delete user from admin page
*
* @_id: userid
* */

app.post('/deleteUser',function(req,res){
	db.deleteUser(req.body._id,function(msg){
		if(msg=="done"){
			res.write("success")
		}
		res.end();
	});
});

/*
* fetch all users to be displayed on follow people main page
* Results are grouped by category
* */
  
  app.get('/fetchAllUsers',function(req,res){
	  var response = {};
      db.getUsers({app:req.query.app},function(err,docs){
          for(var ctr=0;ctr<docs.length;ctr++){
			  var categories = docs[ctr].categories;
			  for(var cctr=0;cctr<categories.length;cctr++){
				  if(response[categories[cctr]]==undefined){
					  response[categories[cctr]] = [];
				  }
				  response[categories[cctr]].push(docs[ctr]);
			  }
          }
	     res.contentType('application/json');
	     res.write(JSON.stringify(response));
	     res.end();
      },{twitter_followers: -1});
  });

/*
* fetch all twitter handles for admin page
* */
app.get('/fetchAllTwitterHandles',function(req,res){
	db.getDistinctForTweets("screen_name",{source:"twitter"},function(err,screen_names){
		res.contentType('application/json');
		res.write(JSON.stringify(screen_names));
		res.end();
	})
});

/*
 * fetch all instagram handles for admin page
 * */

app.get('/fetchAllInstaHandles',function(req,res){
	db.getDistinctForTweets("screen_name",{source:"insta"},function(err,usernames){
		res.contentType('application/json');
		res.write(JSON.stringify(usernames));
		res.end();
	})
});


/*
* returns array of categories
*
* */

app.get('/fetchCategories',function(req,res){
	var p = getCategories(req.query.app);
	p.then(function(categories){
		res.contentType('application/json');
		res.write(JSON.stringify(categories));
		res.end();
	})
});

/*
 * returns array of app
 *
 * */

app.get('/fetchApps',function(req,res){
	var p = getApps();
	p.then(function(apps){
		res.contentType('application/json');
		res.write(JSON.stringify(apps));
		res.end();
	})
});

/*
* fetch users by category for follow user page
* @category
* @device_id
*
* */

  app.get('/fetchAllUsersByCategory',function(req,res){
	  var response = {};
      db.getUsers({app:req.query.app,categories:req.query.category},function(err,docs){
		  db.getFollow_New(req.query.device_id,req.query.app,function(err,result){
			  var follows = [];  
			if(result.length>0){
				follows = result[0].follows;
			}
	          for(var ctr=0;ctr<docs.length;ctr++){
				  var categories = docs[ctr].categories;
				  for(var cctr=0;cctr<categories.length;cctr++){
					  if(categories[cctr]!=req.query.category){
						  continue;
					  }
					  if(response[categories[cctr]]==undefined){
						  response[categories[cctr]] = [];
					  }
					  var index = -1;
				  	  if(follows!=undefined){
				  	  	  index = follows.indexOf(docs[ctr]._id.toString());
				  	  }	
					  response[categories[cctr]].push({id:docs[ctr]._id, name:docs[ctr].name,'profile_pic':docs[ctr].profile_pic, 'follow':(index==-1)?false:true});

				  }
	          }
		     res.contentType('application/json');
		     res.write(JSON.stringify(response));
		     res.end();
		  })
      },{twitter_followers: -1});
  });



app.get('/checkUser',function(req,res){
	db.getFollow_New(req.query.device_id,req.query.app,function(err,user_follows){
		if(user_follows.length==0){
			db.getUsers({default:1,app:req.query.app},function(err,follows){
				var follows_array = [];
				for(var ctr=0;ctr<follows.length;ctr++){
					follows_array.push(follows[ctr]._id.toString());
				}
				db.saveAllFollows(req.query.app,req.query.device_id,follows_array,function(err){
					res.write("done");
					res.end();
				})
			});
		}else{
			res.write("done");
			res.end();
		}
	});
})


http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});