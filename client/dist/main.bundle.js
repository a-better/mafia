/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Debug = __webpack_require__(1);
	var RoomManager = __webpack_require__(2);
	var Network = __webpack_require__(5);
	var UIManager = __webpack_require__(6);

	var roomId = $('#roomId').val();
	var url = $('#url').val();
	var platformServerId = $('#platformServerId').val();
	var nickname = $('#nickname').val();
	var thumbnail = $('#thumbnail').val();

	window.debug = new Debug({'debug': true});

	var roomManager = new RoomManager();

	var uiManager = new UIManager();

	var network = new Network();

	network.setConnection();
	roomManager.setNetwork(network);

	roomManager.setRoom(roomId, url, platformServerId, nickname, thumbnail);


	uiManager.set(roomManager); 

	network.setObserver('roomManager', roomManager);
	roomManager.setObserver('uiManager', uiManager);

	roomManager.room.setMyPlayer(nickname, thumbnail);







/***/ },
/* 1 */
/***/ function(module, exports) {

	var Debug = function(config){
		this.debugMode = true && config.debug;
		this.useAlert = false || config.alert;
	}

	Debug.prototype.constructor = Debug;

	Debug.prototype.log = function(type, msg){
		if(this.debugMode == false)
			return;
		if(typeof console == "undefined")
			return;

		switch(type){
			case "LOG" :
				console.log(msg);
				break;
			case "WARN" :
				console.warn(msg);
				break;
			case "ERROR" :
				if(this.useAlert){
					alert(msg);
				}
				console.error(msg);
				break;						
		};
	}

	module.exports = Debug;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var Room = __webpack_require__(3);

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

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var Player = __webpack_require__(4);

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

/***/ },
/* 4 */
/***/ function(module, exports) {

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



/***/ },
/* 5 */
/***/ function(module, exports) {

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

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var Button = __webpack_require__(7);
	var Chat = __webpack_require__(8);
	var Selector = __webpack_require__(9);
	var UIManager = function(){
		this.button = new Button();
		this.chat = new Chat();
		this.selector = new Selector();
		this.roomManager;

	}

	UIManager.prototype.constructor = UIManager;

	UIManager.prototype = {

		set : function(roomManager){
			this.roomManager = roomManager;
			this.button.set(roomManager);
			this.chat.set(roomManager);
			this.selector.set(roomManager);
		},
		update : function(){
			this.button.update();
			this.chat.update();
			this.selector.update();
		}
	}

	module.exports = UIManager;





/***/ },
/* 7 */
/***/ function(module, exports) {

	
	var Button = function(){
		this.roomManager = {};
		this.detectButton = false;
		this.voteButton = false;
		this.saveButton = false;
		this.killButton = false;

		this.startButton = false;

		this.buttonId = '';

		button = this;
	}

	Button.prototype.constructor = Button;

	Button.prototype = {
		set : function(roomManager){
			this.roomManager = roomManager;
			debug.log("LOG", 'button'+this.roomManager);
			$('#startButton').hide();
			$('#killButton').hide();
			$('#voteButton').hide();
			$('#saveButton').hide();
			$('#detectButton').hide();

			var roomId = this.roomManager.room.roomId;

			$('#startButton').click(function(){
				debug.log("LOG", button.roomManager);
				button.roomManager.network.start(roomId);
			});
			$('.skillButton').click(function(){
				button.buttonId = $(this).data('id');
			});
			$('#selectButton').click(function(){
				var target = $('input[name="selector"]:checked').val();

				$('#selectorModal').modal('hide');

				switch(button.buttonId){
					case 'kill':
						button.roomManager.network.kill(roomId, button.roomManager.room.myPlayer.id, target);	
						break;
					case 'vote':
						button.roomManager.network.vote(roomId, button.roomManager.room.myPlayer.id,target);
						this.roomManager.room.myPlayer.enableVote = false;		
						break;
					case 'save':
						button.roomManager.network.save(roomId, button.roomManager.room.myPlayer.id, target);					
						break;
					case 'detect':
						button.roomManager.network.detect(roomId, button.roomManager.room.myPlayer.id,target);					
						break;			
				}
			});

			$('#agreeButton').click(function(){
				button.roomManager.network.judge(roomId, button.roomManager.room.myPlayer.id,'agree');
			});

			$('#disagreeButton').click(function(){
				button.roomManager.network.judge(roomId, button.roomManager.room.myPlayer.id,'disagree');	
			});		
			
		},
		update : function(){
			debug.log("LOG", 'minActor' + this.roomManager.room.minActor);
			this.updateStartButton();
			this.updateSkillButton();
			
		},
		updateStartButton : function(){
			if(this.roomManager.room.myPlayer.host && this.roomManager.room.getPlayerNumber() >= this.roomManager.room.minActor){
				debug.log("LOG", 'start Button :' + this.startButton + this.roomManager.room.getPlayerNumber()+this.roomManager.room.playing);
				if(this.roomManager.room.playing == false ){
					$('#startButton').show();
				}
				else{
					$('#startButton').hide();
				}
			}		
		},
		updateSkillButton : function(){
			if(this.roomManager.room.myPlayer.dead){
				$('#voteButton').hide();
				$('#detectButton').hide();
				$('#killButton').hide();
				$('#saveButton').hide();

				$('#agreeButton').hide();
				$('#disagreeButton').hide();				
			}
			else{
				if(this.roomManager.room.state == 'day'){
					$('#agreeButton').hide();
					$('#disagreeButton').hide();

					if(this.roomManager.room.myPlayer.enableVote){
						$('#voteButton').show();
						$('#detectButton').hide();
						$('#killButton').hide();
						$('#saveButton').hide();		
					}
					else{
						$('#voteButton').hide();
						$('#detectButton').hide();
						$('#killButton').hide();
						$('#saveButton').hide();
					}
				}
				else if(this.roomManager.room.state == 'night'){
					$('#voteButton').hide();
					$('#agreeButton').hide();
					$('#disagreeButton').hide();	
					if(this.roomManager.room.myPlayer.enableDetect){
						$('#detectButton').show();
					}
					else{
						$('#detectButton').hide();
					}
			
					if(this.roomManager.room.myPlayer.enableKill){
						$('#killButton').show();
					}
					else{
						$('#killButton').hide();
					}
			
					if(this.roomManager.room.myPlayer.enableSave){
						$('#saveButton').show();
					}
					else{
						$('#saveButton').hide();
					}
				}
				else if(this.roomManager.room.state == 'lastSpeech'){
					$('#voteButton').hide();
					$('#detectButton').hide();
					$('#killButton').hide();
					$('#saveButton').hide();

					$('#agreeButton').show();
					$('#disagreeButton').show();				
				}
				else if(this.roomManager.room.state == 'idle'){
					$('#voteButton').hide();
					$('#detectButton').hide();
					$('#killButton').hide();
					$('#saveButton').hide();

					$('#agreeButton').hide();
					$('#disagreeButton').hide();				
				}
			}	
		}
	}

	module.exports = Button;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var ChatStyleTag = __webpack_require__(10);
	var Chat = function(){
		this.roomManager = {};
		this.enableChat = true;
		this.playerNum;
		this.players = [];
		this.myJob = '';
		chat = this;

		//set chatting text style
		this.normalTag = new ChatStyleTag();
		this.mafiaTag = new ChatStyleTag();
		this.deadTag = new ChatStyleTag();
		this.broadcastNoticeTag = new ChatStyleTag();
		this.sendNoticeTag = new ChatStyleTag();
		this.chatDiv = {};
		
	}
	Chat.prototype.cosntructor = Chat;

	Chat.prototype = {
		set : function(roomManager){
			this.roomManager = roomManager;
			var room = this.roomManager.room;
			debug.log("LOG", 'chat'+this.roomManager);
			this.playerNum = roomManager.room.getPlayerNumber();
			$('#messageBox').keydown(function(event){
				if(event.which == 13){
					chat.roomManager.network.sendMessage(room.roomId, room.myPlayer.id, $('#messageBox').val());
					//debug.log('LOG', $('#messageBox').val());
					$('#messageBox').val('');
					$('#messageBox').blur();
				}
			});
			$('#messageButton').click(function(){
				chat.roomManager.network.sendMessage(room.roomId, room.myPlayer.id, $('#messageBox').val());
				//debug.log('LOG', $('#messageBox').val());
				$('#messageBox').val('');
				$('#messageBox').blur();
			});

			this.chatDiv = $('#chattingBox');

			this.normalTag.start = '<p>';
			this.normalTag.end = '</p>';

			this.mafiaTag.start = '<p class="text-danger"><strong>';
			this.mafiaTag.end = '</strong></p>';

			this.deadTag.start = '<p class="text-muted">';
			this.deadTag.end = '</p>';

			this.broadcastNoticeTag.start = '<p class="text-info"><strong>';
			this.broadcastNoticeTag.end = '</strong></p>';

			this.sendNoticeTag.start = '<p class="text-warning"><strong>';
			this.sendNoticeTag.end = '</strong></p>';
		},
		update : function(){
			var messageType = '';
			var message = '';
			if(this.roomManager.room.isPrinted == false){
				this.roomManager.room.isPrinted = true;
				debug.log('LOG', this.roomManager.room.chatting);
				messageType = this.roomManager.room.messageType;
				this.updateChat(messageType);			
			}

			if(this.playerNum != this.roomManager.room.getPlayerNumber()){
				this.players = this.roomManager.room.getPlayerIds();
				this.playerNum = this.roomManager.room.getPlayerNumber();;
				debug.log('LOG', 'chat 42 :' +this.players);
				message  = this.broadcastNoticeTag.start + '현재 방 인원 수'  + this.playerNum + '명' + this.broadcastNoticeTag.end;
				this.chatDiv.append(message);
			}

			if(this.roomManager.room.myPlayer.job != this.myJob && this.roomManager.room.state != 'idle'){
				this.myJob = this.roomManager.room.myPlayer.job;
				debug.log('LOG', '내 직업은 ' +  this.myJob + '입니다.');
				message = this.broadcastNoticeTag.start + '내 직업은 ' +  this.myJob + '입니다.' + this.broadcastNoticeTag.end;
				this.chatDiv.append(message);
			}
		},
		updateChat : function(messageType){
			var message = '';
			switch(messageType){
				case 'normal':
					message = this.normalTag.start + this.roomManager.room.chatting  + this.normalTag.end;
					this.chatDiv.append(message);
					break;
				case 'mafia':
					message = this.mafiaTag.start + this.roomManager.room.chatting  + this.mafiaTag.end;
					this.chatDiv.append(message);			
					break;
				case 'dead':
					message = this.deadTag.start + this.roomManager.room.chatting  + this.deadTag.end;
					this.chatDiv.append(message);			
					break;
				case 'broadcastNotice':
					message = this.broadcastNoticeTag.start + this.roomManager.room.chatting  + this.broadcastNoticeTag.end;
					this.chatDiv.append(message);			
					break;
				case 'sendNotice':
					message = this.sendNoticeTag.start + this.roomManager.room.chatting  + this.sendNoticeTag.end;
					this.chatDiv.append(message);			
					break;			
			}
		}

	}

	module.exports = Chat;



/***/ },
/* 9 */
/***/ function(module, exports) {

	var Selector = function(){
		this.roomManager = {};
		this.livePlayers = [];
	}

	Selector.prototype = Selector;

	Selector.prototype = {

		set : function(roomManager){
			this.roomManager = roomManager;
			this.livePlayers = this.roomManager.room.getLivePlayers();
			$('#selectorModal').hide();
		},
		update : function(){
			if(this.livePlayers.length > 0 && this.livePlayers.length != this.roomManager.room.getLivePlayers().length){
				this.livePlayers  = this.roomManager.room.getLivePlayers();
				$('#selector').empty();
				for(var i=0; i<this.livePlayers.length; i++){
					debug.log("LOG", 'selector 26 :' + this.livePlayers.length);
					var player;
					if(this.livePlayers[i] == this.roomManager.room.myPlayer.id){
						player = this.roomManager.room.myPlayer;
					}
					else{
						player = this.roomManager.room.players[this.livePlayers[i]];	
					}
					debug.log("LOG", 'radio actor ' + player);
					$('#selector').append('<input type="radio" name="selector" value="'+this.livePlayers[i]+'">'+player.nickname);
				}	
			}
		}
	}


	module.exports = Selector;

/***/ },
/* 10 */
/***/ function(module, exports) {

	var ChatStyleTag = function(){
		this.startTag = '';
		this.endTag = '';
	}

	ChatStyleTag.prototype.constructor = ChatStyleTag;

	module.exports = ChatStyleTag;


/***/ }
/******/ ]);