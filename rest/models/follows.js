var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var FollowsSchema = mongoose.Schema({
	device_id:String,
	follows:[String],
	app:String
});

module.exports = mongoose.model('follows', FollowsSchema);

