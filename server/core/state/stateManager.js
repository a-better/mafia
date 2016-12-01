var StateManager = function(){
	this.states = {}; 
	this.current = '';
}
StateManager.prototype.constructor = StateManager;

StateManager.prototype = {
	add : function(key, state, autostart){
		if(autostart ===  undefined){
			autostart = false;
		}
		this.states[key] = state;
		if(autostart){
			this.changeState(key);
		}	
	},
	checkState : function(key){
		if(this.states[key]){
			return true;
		}
		else{
			return false;
		}
	},
	changeState : function(key){
		if(this.checkState(key)){
			this.current = key;
		}
	},
	destroy : function(){
		this.current = '';
	},
	getCurrentState : function(){
		return this.states[this.current];
	},
	remove : function(key){
		delete this.states[key];
	},
	update : function(key, state){
		if(this.checkState(key)){
			this.states[key] = state;
			this.current = key;
		}
	}
}

module.exports = StateManager;