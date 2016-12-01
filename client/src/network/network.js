var Network = function(){
	this.observers = {};
	this.socket;
	network = this;	
}

Network.prototype.constructor = Network;

Network.prototype = {
	setObserver : function(key, obj){
		network.observers[key] = obj;
	},
	setConnection : function(){
		var domain = document.domain;
		var port = location.port;
		var url = "http://"+domain+":"+port;

		this.socket = io(url);
		network.setEventHandlers();
	},
	getSocket : function(){
		return this.socket;
	},  
 	setEventHandlers : function(){
 	  this.socket.on('join', network.onJoin);
 	  this.socket.on('leave', network.onLeave);
 	  this.socket.on('dead', network.onDead);
 	  this.socket.on('change state', network.onChangeState);
 	  this.socket.on('broadcast notice', network.onBroadcastNotice);
 	  this.socket.on('send notice', network.onSendNotice);
 	  this.socket.on('send message', network.onSendMessage);
 	  this.socket.on('broadcast message', network.onBroadcastMessage);
 	  this.socket.on('end', network.onEnd);
 	  this.socket.on('init', network.onInit);
 	  this.socket.on('host', network.onHost);
 	  this.socket.on('set job', network.onSetJob);
 	  this.socket.on('current judge', network.onJudge);
 	},
 	onLeave : function(data){	
 		this.notifyObserver('leave', data);
 	},
 	onJoin : function(data){
 		debug.log("LOG", 'join');
 		network.notifyObserver('join', data);
 	},
 	onDead : function(data){
 		debug.log("LOG", 'network 46 : dead' + data.killedActor);
 		network.notifyObserver('dead', data);
 	},
 	onChangeState : function(data){
 		debug.log("LOG", 'change state');
 		network.notifyObserver('change state', data);
 	},
 	onInit : function(data){
 		debug.log("LOG", 'init');
 		network.notifyObserver('init', data);
 	},
  	onHost : function(data){
  		debug.log("LOG", 'host');
 		network.notifyObserver('host', {});
 	},
 	onSetJob : function(data){
 		debug.log("LOG", 'set job');
 		network.notifyObserver('set job', data);
 	},
 	onBroadcastNotice : function(data){
 		network.notifyObserver('broadcast notice', data);
 	},

 	onSendNotice : function(data){
 		network.notifyObserver('send notice', data);
 	},
 	onSendMessage :  function(data){
 		network.notifyObserver('send message', data);
 	},
 	onBroadcastMessage : function(data){
 		network.notifyObserver('broadcast message', data);
 	},
 	onEnd : function(data){
 		network.notifyObserver('end', data);
 	},
 	onJudge : function(data){
 		network.notifyObserver('judge', data);
 	},
	notifyObserver : function(tag, data){
		for(key in network.observers){
			network.observers[key].update(tag, data);
		}
	},
	joinRoom : function(roomId, nickname, thumbnail){
		debug.log("LOG", roomId+'/' + nickname +'/' + thumbnail);
		this.socket.emit('join room', {roomId : roomId, nickname : nickname, thumbnail : thumbnail});
	},
	start : function(roomId){
		this.socket.emit('start',{roomId : roomId});
	},
	kill : function(roomId, actorId, targetId){
		this.socket.emit('kill',{roomId : roomId, actorId : actorId, targetId : targetId});
	},
	vote : function(roomId, actorId, targetId){
		this.socket.emit('vote',{roomId : roomId, actorId : actorId, targetId : targetId});
	},
	detect : function(roomId, actorId, targetId){
		this.socket.emit('detect',{roomId : roomId, actorId : actorId, targetId : targetId});
	},
	save : function(roomId, actorId, targetId){
		this.socket.emit('save',{roomId : roomId, actorId : actorId, targetId : targetId});
	},
	sendMessage : function(roomId, actorId, message){
		debug.log("LOG", "network 106");
		this.socket.emit('send message',{roomId : roomId, actorId : actorId, message : message});
	},
	judge : function(roomId, actorId, judge){
		debug.log("LOG", "network 114 judge");
		this.socket.emit("judge", {roomId : roomId, actorId : actorId, judge : judge});
	}
}

module.exports = Network;