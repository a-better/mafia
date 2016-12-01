var Playing = require('../../../core/state/room_state/playing');
var LastSpeech = function(id){
	Playing.call(this, id);
	this.chatCitizen = true;
	this.chatMafia = false;
	this.enableKill = false;
	this.enableDetect = false;
	this.enableVote = true;

	this.candidate = '';
	this.time = 5;
}
LastSpeech.prototype.constructor = LastSpeech;
LastSpeech.prototype = Object.create(Playing.prototype);

module.exports  = LastSpeech;
