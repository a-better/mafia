var StateManager = require('../state/stateManager');
var GameObject = function(id){
	this.id = id;
	this.stateManager = new StateManager();
}

GameObject.prototype.constructor = GameObject;

GameObject.prototype = {
	init : function(){
	},
	create : function(){
	},
	paused : function(){
	},
	update : function(){
	}
}
module.exports = GameObject;