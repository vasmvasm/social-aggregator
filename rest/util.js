var _ = require("underscore")

module.exports = {
	concat:function(array1,array2){
		if(array1==undefined){
			return array2;
		}
		if(array2==undefined){
			return array1;
		}
		return array1.concat(array2);
	},

	findIndex:function(array,element){
		return _.findIndex(array,{
			category:element
		})
	}

}