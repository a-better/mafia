var Playing = require('../../../core/state/room_state/playing');
var Day = function(id){
	Playing.call(this, id);
	this.count = 0;
	this.chatCitizen = true;
	this.chatMafia = false;
	this.enableKill = false;
	this.enableDetect = false;
	this.enableVote = true;

	this.time = 5;
}
Day.prototype.constructor = Day;
Day.prototype = Object.create(Playing.prototype);

module.exports  = Day;
