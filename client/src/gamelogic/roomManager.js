var Room = require('./room/room');

var RoomManager = function(){
	this.network = {};
	this.observers = {};
	this.room = {};
}

RoomManager.prototype = RoomManager;

RoomManager.prototype = {

	setRoom : function(roomId, url, platformServerId, nickname, thumbnail){
		this.room = new Room(roomId, url, platformServerId);
		this.room.setMyPlayer(nickname, thumbnail);
		this.network.joinRoom(roomId, nickname, thumbnail);
	},
	setNetwork : function(network){
		this.network = network;
	},
	setObserver : function(key, obj){
		this.observers[key] = obj;
	},
	notifyObserver : function(){
		for(key in this.observers){
			this.observers[key].update();
		}
	},
	init : function(data){
		this.room.setPlayers(data);
		this.room.minActor = data.minActor;
		this.notifyObserver();
	},
	update : function(tag, data){
		switch(tag){
			case 'join':
				this.updateJoin(data);
				break;
			case 'leave':
				this.updateLeave(data);
				break;	
			case 'dead':
				this.updateDead(data);
				break;
			case 'change state':
				this.updateState(data);
				break;
			case 'init':
				this.init(data);
				break;
			case 'host':
				this.room.setHost();
				this.notifyObserver();
				break;
			case 'set job':
				this.room.setJob(data.job);
				this.notifyObserver();
				break;
			case 'send notice':
				this.room.onSendNotice(data);
				this.notifyObserver();
				break;
			case 'broadcast notice':
				this.room.onBroadcastNotice(data);
				this.notifyObserver();
				break;
			case 'send message':
				this.room.onSendMessage(data);
				this.notifyObserver();
				break;
			case 'broadcast message':
				this.room.onBroadcastMessage(data);
				this.notifyObserver();
				break;						
			case 'end':
				this.room.end(data);
				this.notifyObserver();	
				break;
			case 'judge':
				this.room.judge(data);
				this.notifyObserver();
				break;														 		
		};
	},
	updateJoin : function(data){
		this.room.join( data.nickname, data.thumbnail, data.id);
		this.notifyObserver();
	},
	updateLeave : function(data){
		this.room.leave(data.id);
		this.notifyObserver();
	},
	updateDead : function(data){
		this.room.dead(data.killedActor);
		this.notifyObserver();
	},
	updateState : function(data){
		this.room.setState(data.state);
		this.notifyObserver();
	}		
}

module.exports = RoomManager;