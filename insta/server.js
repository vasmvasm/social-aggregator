var http = require('http');
var express = require('express');
var request = require("request");
var api = require('instagram-node').instagram();
var app = express();
 
// app.configure(function() {
//   // The usual...
// });
 
api.use({
  client_id: "44b9a33b22ed417fb3c839f5d2545505",
  client_secret: "99ffd0c36950492dae20223981b2e198"
});
 
var redirect_uri = 'http://localhost:3000/callback';
 
exports.authorize_user = function(req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};
 
exports.handleauth = function(req, res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("Didn't work");
    } else {
      console.log('Yay! Access token is ' + result.access_token);
	  request.get({url:"https://api.instagram.com/v1/users/self/feed?access_token="+result.access_token}, function (e, r, body) {
		  res.send(body);
      });
	  
    }
  });
};
 
// This is where you would initially send users to authorize 
app.get('/authorize_user', exports.authorize_user);
// This is your redirect URI 
app.get('/callback', exports.handleauth);
 
http.createServer(app).listen(3000, function(){
  console.log("Express server listening on port 3000");
});	