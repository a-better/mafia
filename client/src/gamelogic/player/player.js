var Player = function(nickname, thumbnail, id){
	this.nickname = nickname;
	this.thumbnail = thumbnail;
	this.id = id;

	this.dead = false;
	this.isMafia = false;
	this.contactMafia = false;
	this.job = '';
	this.host = false;
	this.enableDetect = false;
	this.enableSave = false;
	this.enableVote = false;
	this.enableKill = false;
}

Player.prototype.constructor = Player;


Player.prototype = {
	reset : function(){
		this.job = '';
		this.dead = false;
		this.isMafia = false;
		this.enableDetect = false;
		this.contactMafia = false;
		this.enableSave = false;
		this.enableVote = false;
		this.enableKill = false;
	},
	setId : function(id){
		this.id = id;
	}
}

module.exports = Player;

