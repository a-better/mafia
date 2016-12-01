var State = function(key){
	if(typeof key === "undefined"){
		this.key = '';
	}
	else{
		this.key = key;
	}
}

State.prototype.constructor = State;

State.prototype = {
	init : function(){
	},
	create : function(){
	},
	paused : function(){

	},
	update : function(){

	}
}

module.exports = State;