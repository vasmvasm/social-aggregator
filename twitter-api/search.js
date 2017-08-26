var request = require('request');
var fs = require('fs');
var oauth = {
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
};


var query = "%23ToleranceCounter"
	
    
var url = 'https://api.twitter.com/1.1/search/tweets.json?q='+query+'&result_type=popular';

	 var file = fs.createWriteStream('search.json');
	 request.get({url:url, oauth:oauth}).pipe(file);


