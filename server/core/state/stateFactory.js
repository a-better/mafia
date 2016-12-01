var Idle = require('./room_state/idle');
var Playing = require('./room_state/playing');

var StateFactory = function(){

}
StateFactory.prototype.constructor = StateFactory;

StateFactory.prototype = {
	idle : function(key){
		if(typeof key === "undefined"){
			return new Idle();
		}
		else{
			return new Idle(key);
		}
		
	},
	playing : function(key){
		if(typeof key === "undefined"){
			return new Playing();
		}
		else{
			return new Playing(key);
		}
	}
}

module.exports = StateFactory;
