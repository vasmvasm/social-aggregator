var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var UserFollowSchema = mongoose.Schema({
	device_id:String,
	categories:Schema.Types.Mixed,
	app:String
});

module.exports = mongoose.model('user_follow', UserFollowSchema);

