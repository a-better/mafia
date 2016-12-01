var Player = require('../player/player');

var Room = function(roomId, url, platformServerId){
	this.myPlayer;
	this.players = {};
	this.state = 'idle';
	this.day =0;
	this.night = 0;

	this.chatting = '';
	this.isPritnted = false;
	this.isStateChanged = false;
	this.messageType = 'normal';

	this.roomId= roomId;
	this.url = url;
	this.platformServerId = platformServerId;

	this.playing = false;

	this.minActor = 9999;
}

Room.prototype.constructor = Room;

Room.prototype = {
	reset : function(){
		this.state = 'idle';
		this.day = 0;
		this.night = 0;
		this.playing = false;
		this.myPlayer.reset();
		for(key in this.players){
			this.players[key].dead = false;
		}
	},
	setMyPlayer : function(nickname, thumbnail){
		this.myPlayer = new Player(nickname, thumbnail);
		debug.log("LOG", 'room 37 join' + nickname);
	},
	join : function(nickname, thumbnail, id){
		this.players[id] = new Player(nickname, thumbnail, id);
		debug.log("LOG", 'room 41 join' + nickname);
		debug.log("LOG", 'room 42 join' + Object.keys(this.players).length);
	},
	setPlayers : function(data){
		this.myPlayer.id = data.id;
		debug.log("LOG", 'room 44 :' + this.myPlayer.id);
		for(key in data.actorManager.objects){
			var player = data.actorManager.objects[key];
			debug.log("LOG", 'room 47 :' + Object.keys(data.actorManager.objects).length);
			if(this.myPlayer.id != player.id){
				this.players[player.id] = new Player(player.id, player.nicname, player.thumbnail);
			}		
		}
		debug.log("LOG", 'room 52 :' +  Object.keys(this.players));
	},
	setState : function(state){		
		if(this.state == 'idle' && state == 'night'){
			this.playing = true;
			this.night++;
		}
		else if(this.state == 'night' && state == 'day'){
			this.myPlayer.enableVote = true;
			this.day++;
		}
		else if(this.state == 'day' && state == 'night'){
			this.night++;
		}
		this.state = state;
		this.isStateChanged = true;
		debug.log("LOG", this.state);
	},
	setHost : function(){
		this.myPlayer.host = true;
	},
	leave : function(id){
		delete this.players[id];
	},
	kill : function(id){
		if(this.myPlayer.id == id){
			this.myPlayer.dead = true;
		}
		else{
			this.players[id].dead = true;
		}
	},
	setJob : function(job){
		this.myPlayer.enableVote = true;
		switch(job){
			case 'police':
				this.setPolice();
				break;
			case 'doctor':
				this.setDoctor();
				break;	
			case 'spy':
				this.setSpy();
				break;
			case 'soldier':
				this.setSoldier();
				break;
			case 'mafia':
				this.setMafia();
				break;
			case 'citizen':
				this.setCitizen();
				break;				
		};
	},
	setPolice : function(){
		this.myPlayer.job = '경찰';
		this.myPlayer.enableDetect = true;
	},
	setDoctor : function(){
		this.myPlayer.job = '의사';
		this.myPlayer.enableSave = true;
	},
	setSpy : function(){
		this.myPlayer.job = '스파이';
		this.myPlayer.enableDetect = true;
		this.myPlayer.isMafia = true;
	},
	setSoldier : function(){
		this.myPlayer.job = '군인';
	},
	setMafia : function(){
		this.myPlayer.job = '마피아';
		this.myPlayer.enableKill = true;
		this.myPlayer.isMafia = true;
	},
	setCitizen : function(){
		this.myPlayer.job = '시민';
	},
	updateChatting : function(chat){
		this.chatting = chat;
		this.isPrinted = false;
	},
	getPlayerNumber : function(){
		return Object.keys(this.players).length + 1;
	},
	getPlayerIds : function(){
		var array = Object.keys(this.players);
		array.push(this.myPlayer.id);
		return array;
	},
	getLivePlayers : function(){
		var array =[];
		if(this.myPlayer.dead != true){
			array.push(this.myPlayer.id);
		}
		for(key in this.players){
			if(this.players[key].dead != true){
				array.push(key);
			}
		}
		return array;
	},
	isPlaying : function(){
		if(this.state == 'day'){
			return true;
		}
		else if(this.state == 'night'){
			return true;
		}
		else if(this.state == 'idle'){
			return false;
		}
	},
	dead : function(victim){
		if(this.myPlayer.id == victim){
			this.myPlayer.dead = true;
		}
		else{
			for(key in this.players){
				if(this.players[key].id == victim){
					this.players[key].dead = true;
				}
			}
		}
	},
	getNickname : function(actor){
		if(this.myPlayer.id == actor){
			return this.myPlayer.nickname;
		}
		else{
			for(key in this.players){
				if(this.players[key].id == actor){
					return this.players[key].nickname;
				}
			}
		}
	},	
	onBroadcastMessage : function(data){
		var nickname = this.getNickname(data.actor);
		this.chatting = nickname+':' + data.message;
		this.messageType = 'normal';
		this.isPrinted = false;	
	},
	onSendMessage : function(data){
		var nickname = this.getNickname(data.actor);
		this.chatting = nickname+':' + data.message;
		this.isPrinted = false;	
		if(data.tag == 'mafia'){
			this.messageType = 'mafia';
		}
		else if(data.tag == 'dead'){
			this.messageType = 'dead';
		}
	},	
	onBroadcastNotice : function(data){
		this.chatting = data.message;
		this.isPrinted = false;
		this.messageType = 'broadcastNotice';
	},
	onSendNotice : function(data){
		this.chatting = data.message;
		this.isPrinted = false;	
		this.messageType = 'sendNotice';
	},
	end : function(data){
		this.chatting = data.result + '승리';
		this.isPrinted = false;
		this.messageType = 'broadcastNotice';	
		this.reset();
	},
	judge : function(data){
		this.chatting = '찬성 : ' + data.judge.agree +'표, 반대 : ' + data.judge.disagree + '표';
		this.isPrinted = false;
		this.messageType = 'broadcastNotice';
	}	

}

module.exports = Room;