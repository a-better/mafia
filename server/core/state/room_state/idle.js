var State = require('../state');
var StateManager = require('../stateManager');
var Idle = function(key){
	State.call(this, key);
	this.playing = false;
}

Idle.prototype.contructor = Object.create(State.prototype);

Idle.prototype = {
}
module.exports = Idle;