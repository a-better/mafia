var GameObjectManager = require('../../core/objects/gameObjectManager');
var MafiaObjectFactory = require('../factory/mafiaObjectFactory');
var StateFactory = require('../factory/mafiaStateFactory');

var MafiaRoomManager = function(){
   GameObjectManager.call(this);
   this.gameObjectFactory = new MafiaObjectFactory();
   this.stateFactory = new StateFactory({'day':'day', 'night' : 'night'});
   this.network;
}

MafiaRoomManager.prototype.constructor = MafiaRoomManager;
MafiaRoomManager.prototype = Object.create(GameObjectManager.prototype);

MafiaRoomManager.prototype.setNetwork = function(network){
	this.network = network;
}

MafiaRoomManager.prototype.create = function(id, max, min, platformServerId, url){
	var room = this.gameObjectFactory.mafiaRoom(id, max, min, platformServerId, url);
	return room;
}
MafiaRoomManager.prototype.set = function(key){
	this.objects[key].setState(this.stateFactory);
	this.objects[key].setNetwork(this.network);
}
MafiaRoomManager.prototype.join = function(key, id, nickname, thumbnail){
	this.objects[key].join(id, nickname, thumbnail);
}
MafiaRoomManager.prototype.leave = function(key, id){
	this.objects[key].leave(id);
}
MafiaRoomManager.prototype.startGame = function(key){
	var room = this.objects[key];
	room.start(room);
}
MafiaRoomManager.prototype.endGame = function(key){
	var room = this.objects[key];
	room.end();
}

MafiaRoomManager.prototype.isPlaying = function(key){
	var room = this.objects[key];
	if(room.isPlaying()){
		return true;
	}
	else{
		return false;
	}
}
MafiaRoomManager.prototype.haveRoom = function(key){
	if(this.objects[key]){
		return true;
	}
	else{
		return false;
	}
}
module.exports = MafiaRoomManager;