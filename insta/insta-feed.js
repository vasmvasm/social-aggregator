var request = require("request");
var mongoose = require("mongoose");

var access_token ="1699284780.44b9a33.d0c1025de8f9446d9ad4c53c6af32b44"

// var nodeSchema = mongoose.Schema({
// 	type:String,
// 	comments:Number,
// 	likes:Number,
// 	image:String,
// 	username:String,
// 	full_name:String,
// 	profile_pic:String,
// 	text:String,
// 	timestamp_ms:Number,
// 	id:String
// });


var nodeSchema = mongoose.Schema({
		type:String,
		comments:Number,
		likes:Number,
		name:String,
		screen_name: String,
		tweet: String,
		timestamp_ms:Number,
    	tweetId:String,
		profile_image_url:String,
		media_url:String,
		source:String
});

var user_model = mongoose.model('tweets', nodeSchema);
var db = mongoose.connection;
db.once('open', function callback () {
	makeRequest();
	setInterval(makeRequest,60000);

});


function savePhoto(e, r, body) {
		if(body!=null&&body.data!=null){	
			var data  = body.data;
			var length = data.length;
			console.log(length);
			for(var ctr=0;ctr<length;ctr++){
		      	 var newObj = new user_model({
		   			 type:data[ctr].type,
					 comments:data[ctr].comments==null?0:data[ctr].comments.count,
					 likes:data[ctr].likes==null?0:data[ctr].likes.count,
					 media_url:data[ctr].images==null?"":data[ctr].images.low_resolution.url,
					 screen_name:data[ctr].user==null?"":data[ctr].user.username,
					 name:data[ctr].user==null?"":data[ctr].user.full_name,
					 profile_image_url:data[ctr].user==null?"":data[ctr].user.profile_picture,
					 tweet:data[ctr].caption==null?"":data[ctr].caption.text,
					 timestamp_ms:data[ctr].created_time*1000,
					 tweetId:data[ctr].id,
					 source:'insta'
		        });
				
		      	 newObj.save(function(err){
					 if(err!=null){
					 	console.log(err);
					 }
		      	 });
			}
			if(length==20){
				if(body.pagination.next_url!=undefined){
					console.log("Getting Next Page");
					makeNextPage(body.pagination.next_url)
				}
			}else{
				return;
			}
		}
}

var min_id=0;
function makeRequest(){
	min_id=0;
	user_model.find({source:'insta'}).sort({timestamp_ms:-1}).exec(function(e,doc){

		if(doc.length>0){
			min_id=doc[0].tweetId;
		}
		request.get({url:"https://api.instagram.com/v1/users/self/feed?count=20&access_token="+access_token+"&min_id="+min_id,json:true}, savePhoto);
	});
}


function makeNextPage(next_page){
	console.log(next_page);
	request.get({url:next_page+"&min_id="+min_id,json:true},savePhoto);
}

mongoose.connect('mongodb://localhost/play');


