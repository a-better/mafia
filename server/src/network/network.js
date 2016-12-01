var Network = function(){
	this.roomManager = {};
	network = this;
};

Network.prototype.Constructor = Network;
Network.prototype = {
	setRoomManager : function(roomManager){
		this.roomManager = roomManager;
	},
	setConnection : function(server){
		io = require("socket.io").listen(server);
		console.log('setConnection');
		this.setEventHandlers();
	},
	setEventHandlers: function(){
		io.on("connection", function(client) {
			console.log('connected !'+ ':'+ client.id);
			client.on("join room", network.onJoinRoom);
			client.on("start", network.onStart);
			client.on("kill", network.onKill);
			client.on("vote", network.onVote);
			client.on("detect", network.onDetect);
			client.on("save", network.onSave);
			client.on("judge", network.onJudge);
			client.on("send message", network.onSendMessage);

			//client.on("disconnect", network.onClientDisconnect);
			///client.on("use skill", network.onUseSkill);
			//client.on("vote player", network.onVotePlayer);
			
			//client.on('change turn', network.onChangeTurn);
			//client.on("send data", this.onSendData);
		});
	},
	onJoinRoom : function(data){
		this.roomId = data.roomId;
		this.join(data.roomId);
		debug.log("LOG", 'join' + this.roomId);
		network.sendRoomInfo(this.id, data.roomId);
		network.roomManager.join(data.roomId, this.id, data.nickname, data.thumbnail);
		var room = io.sockets.adapter.rooms[this.id];
		
		
		this.broadcast.to(this.roomId).emit('join',{id : this.id, nickname : data.nickname, thumbnail : data.thubmnail});
		debug.log("LOG", 'network 34 adapter.room.length' + io.sockets.adapter.rooms[this.roomId]);
	},
	onClientDisconnect : function(){
		debug.log("LOG", 'disconnect' + this.roomId);
		network.roomManager.leave(this.roomId, this.id);
		this.broadcast.to(this.roomId).emit('leave', {id : this.id});
	},
	sendRoomInfo : function(id, roomId){
		var room = network.roomManager.objects[roomId];
		io.to(id).emit('init', {id : id, actorManager : room.actorManager, minActor : room.minActor});
	},
	setHost : function(id){
		io.to(id).emit('host');
	},
	setJob : function(roomId, id, job){
		io.to(id).emit('set job', {job : job});
	},
	dead : function(roomId, killedActor){
		io.sockets.in(roomId).emit('dead', {killedActor : killedActor});
	},
	changeState : function(roomId, state){
		io.sockets.in(roomId).emit('change state', {state : state});
	},
	onStart : function(data){
		network.roomManager.startGame(data.roomId);
	},
	onKill : function(data){
		network.roomManager.objects[data.roomId].useSkill(data.actorId, data.targetId);
	},
	onDetect : function(data){
		network.roomManager.objects[data.roomId].useSkill(data.actorId, data.targetId);	
	},
	onSave : function(data){
		network.roomManager.objects[data.roomId].useSkill(data.actorId, data.targetId);		
	},
	onVote : function(data){
		network.roomManager.objects[data.roomId].vote(data.actorId, data.targetId);		
	},
	onSendMessage : function(data){
		var room = network.roomManager.objects[data.roomId];
		var state = room.stateManager.current;
		var actorJob = room.actorManager.getJob(data.actorId);
		var dead = room.actorManager.isDead(data.actorId);
		if(state == 'idle'){
			network.broadcastMessage(this, data.roomId, data.actorId, data.message);
		}
		else{	
			if(dead){
				var deads = room.actorManager.getDeadActors();
				for(var i=0; i<deads.length; i++){
					network.sendMessage( data.actorId, deads[i].id, 'dead', data.message);
				}
			}
			else{
				if(state == 'night'){
					if(actorJob == 'mafia'){
						var mafias = room.actorManager.getMafiaAndSpy();
						for(var i=0; i<mafias.length; i++){
							network.sendMessage( data.actorId, mafias[i].id, 'mafia', data.message);
						}
					}
				}
				else{
					network.broadcastMessage(this, data.roomId, data.actorId, data.message);
				}
			}
		}

	},
	onJudge : function(data){
		console.log('network 116 onJudge');
		network.roomManager.objects[data.roomId].judge(data.actorId, data.judge);
	},
	judge : function(roomId, currentResult){
		io.sockets.in(roomId).emit('current judge', {judge : currentResult});
	},
	sendNotice : function(actor, target, message){
		console.log('network 112 send notice :'+message);
		io.to(actor).emit('send notice', {target : target, message : message});
	},
	broadcastNotice : function(room, message){
		console.log('network 115 broadcast notice :'+message);
		io.sockets.in(room).emit('broadcast notice', {message : message});
	},
	sendMessage : function(actor, target, tag, message){
		console.log('network 120 send message :'+message);
		io.to(target).emit('send message', {actor : actor, tag : tag, message : message});
	},
	broadcastMessage : function(client, room, actor, message){
		console.log('network 121');
		console.log('network 125 broadcast message :'+message);
		io.sockets.in(room).emit('broadcast message', {actor : actor, message : message});
	},
	end(room, result){
		io.sockets.in(room).emit('end', {result:result});	
	}
};

module.exports = Network;