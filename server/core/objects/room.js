var Actor = require('./actor');
var GameObject = require('./gameObject');
var ActorManager = require('./actorManager');
var Room = function(id, max, min){
	GameObject.call(this, id);
	this.game = '';
	this.playingTime =  2;
	this.actorManager = new ActorManager();
	this.roomManager = new Object();
	this.maxActor = max || 9999;
	this.minActor = min || 1;
	myRoom = this;
}

Room.prototype = Object.create(GameObject.prototype);
Room.prototype.constructor = Room;
Room.prototype.setState = function(stateFactory){
	var idle = stateFactory.idle();
	var playing = stateFactory.playing();
	this.stateManager.add('idle', idle, true);
	this.stateManager.add('playing', playing);
}
Room.prototype.join= function(id, nickname, thumbnail){
	this.actorManager.add(id, nickname, thumbnail);
	if(this.actorManager.length() >= this.minActor && this.stateManager.current == 'idle'){
		this.start(this);
	}
}
Room.prototype.leave = function(id){
	this.actorManager.remove(id);
	if(this.actorManager.length() < this.minActor && this.stateManager.current == 'playing'){
		this.end();
	}
}
Room.prototype.start = function(room){
	this.game = setTimeout(function(){room.end();}, this.playingTime * 1000);
	this.stateManager.changeState('playing');
}
Room.prototype.end = function(){
	clearTimeout(this.game);
	this.game = '';
	this.stateManager.changeState('idle');
}
Room.prototype.update = function(){
	if(this.stateManager.current == 'idle'){

	}
	else if(this.stateManager.current == 'playing'){

	}
}

module.exports = Room;