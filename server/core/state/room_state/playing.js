var State = require('../state');
var StateManager = require('../stateManager');
var Playing = function(key){
	State.call(this, key);
	this.playing = true;
}

Playing.prototype.contructor = Object.create(State.prototype);

Playing.prototype = {
}
module.exports = Playing;