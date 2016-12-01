var Playing = require('../../../core/state/room_state/playing');
var Night = function(id){
	Playing.call(this, id);
	this.count = 0;
	this.chatCitizen = false;
	this.chatMafia = true;
	this.enableKill = true;
	this.enableDetect = true;
	this.enableVote = false;

	this.time = 5;
}
Night.prototype.constructor = Night;
Night.prototype = Object.create(Playing.prototype);
module.exports  = Night;
