var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var photosSchema = mongoose.Schema({
     	type:String,
	comments:Number,
	likes:Number,
	image:String,
	username:String,
	full_name:String,
	profile_pic:String,
	text:String,
	timestamp_ms:Number,
	id:String,
        timestamp:String	
});

module.exports = mongoose.model('photos', photosSchema);
