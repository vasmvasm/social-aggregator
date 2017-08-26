var request = require('request');
var fs = require('fs');
var oauth = {
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
};

	var map = {
		'214565101': 'world_news.json',
		'214563025': 'bollywood.json',
		'214563224': 'english_news.json',
		'214563208': 'hindi_news.json',
		'214563193': 'hollywood.json',
		'214563131': 'marathi.json',
		'214563031': 'politics.json',
		'214563041': 'sports.json',
		'214563149': 'telugu.json'
	}
	
    
 // var url = 'https://api.twitter.com/1.1/lists/list.json?screen_name=vasmtest';


 for(var list_id in map){
	 var url = 'https://api.twitter.com/1.1/lists/members.json?count=200&list_id='+list_id;
	 var file = fs.createWriteStream(map[list_id]);
	 request.get({url:url, oauth:oauth}).pipe(file);
 }


