var MafiaRoomManager = require('./room/mafiaRoomManager');
var Network = require('./network/network');
var Engine = function(){
	this.network = new Network();
	this.roomManager = new MafiaRoomManager();

	this.roomManager.setNetwork(this.network);
	console.log(this.roomManager);
	this.network.setRoomManager(this.roomManager);

}

Engine.prototype.constructor = Engine;
Engine.prototype = {

}
module.exports = Engine;