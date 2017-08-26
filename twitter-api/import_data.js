var request = require('request');
var db = require('./dbAccess');
var fs = require('fs');

var map = {
	'/json/world_news.json': 'World News',
	'/json/bollywood.json': 'Bollywood',
	'/json/english_news.json': 'English News',
	'/json/hindi_news.json': 'Hindi News',
	'/json/hollywood.json': 'Hollywood',
	'/json/marathi.json': 'Marathi',
	'/json/politics.json': 'Politics',
	'/json/sports.json': 'Sports',
	'/json/telugu.json': 'Telugu'
}



for(var path in map){
	var url = 'http://localhost:10080'+path;

	request.get({url:url,json:true},function(e,r,body){
		var users = body.users;
		users.forEach(function(user){
			var cat = map[r.client._httpMessage.path];
			db.saveUsers('play',cat,cat,user.name,user.screen_name,null,user.profile_image_url,user.followers_count,false,function(e,doc){

					var path = user.profile_image_url;

					var file = fs.createWriteStream('public/images/'+doc._id);
					request.get(path).pipe(file);


					file = fs.createWriteStream('public/images/'+doc._id+"_bigger");
					path = path.replace('_normal','_bigger');
					request.get(path).pipe(file);
					 console.log(doc);
			});

		});
	});
	
	
}
