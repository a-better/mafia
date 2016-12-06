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
	var Network = __webpack_require__(8);
	var UIManager = __webpack_require__(9);

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
			this.room.seatManager.createSeats(data.maxActor);
			this.room.setPlayers(data);
			this.room.minActor = data.minActor;
			this.room.maxActor = data.maxActor;		
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
	var SeatManager = __webpack_require__(5);
	var Room = function(roomId, url, platformServerId){
		this.myPlayer;
		this.players = {};
		this.seatManager = new SeatManager();
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
		this.maxActor = 0;
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
			this.seatManager.join(this.players[id]);
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
					this.players[player.id] = new Player(player.nickname, player.thumbnail, player.id);
					this.seatManager.join(this.players[player.id]);
				}		
			}
			this.seatManager.join(this.myPlayer);
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
			this.seatManager.leave(this.players[id].seat);
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
		getPlayer : function(actor){
			if(this.myPlayer.id == actor){
				return this.myPlayer;
			}
			else{
				for(key in this.players){
					if(this.players[key].id == actor){
						return this.players[key];
					}
				}
			}
		},	
		onBroadcastMessage : function(data){
			var player = this.getPlayer(data.actor);
			this.chatting = player.nickname+':' + data.message;
			this.messageType = 'normal';
			this.isPrinted = false;	

			player.isTalk = true;
			player.talk = data.message;

		},
		onSendMessage : function(data){
			var player = this.getPlayer(data.actor);
			this.chatting = player.nickname+':' + data.message;
			this.isPrinted = false;	
			if(data.tag == 'mafia'){
				this.messageType = 'mafia';
			}
			else if(data.tag == 'dead'){
				this.messageType = 'dead';
			}

			player.isTalk = true;
			player.talk = data.message;
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

		this.isTalk = false;
		this.talk = '';

		this.seat = new Object();
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
/***/ function(module, exports, __webpack_require__) {

	var GameObjectManager = __webpack_require__(6);
	var Seat = __webpack_require__(7);
	var SeatManager = function(){
		GameObjectManager.call(this);
		GAME_WIDTH = 1248 * 0.5;
		GAME_HEIGHT = 1024 * 0.5;
		this.seatPos = [
			{
				x: GAME_WIDTH * 0.71,
				y: GAME_HEIGHT * 0.51
			},
			{
				x: GAME_WIDTH * 0.64,
				y: GAME_HEIGHT * 0.31
			},
			{
				x: GAME_WIDTH * 0.36,
				y: GAME_HEIGHT * 0.36
			},
			{
				x: GAME_WIDTH * 0.75,
				y: GAME_HEIGHT * 0.39
			},
			{
				x: GAME_WIDTH * 0.51,
				y: GAME_HEIGHT * 0.66 
			},
			{
				x: GAME_WIDTH * 0.64,
				y: GAME_HEIGHT * 0.69 
			},
			{
				x: GAME_WIDTH * 0.39,
				y: GAME_HEIGHT * 0.51
			},
			{
				x: GAME_WIDTH * 0.43,
				y: GAME_HEIGHT *0.86
			},
			{
				x:GAME_WIDTH * 0.46,
				y: GAME_HEIGHT *0.66
			},
			{
				x: GAME_WIDTH * 0.78,
				y: GAME_HEIGHT * 0.9
			},																		
		]
	}

	SeatManager.prototype.constructor = SeatManager;
	SeatManager.prototype = Object.create(GameObjectManager.prototype);
	SeatManager.prototype.getAvailableSeat = function(){
		for(key in this.objects){
			if(this.objects[key].state == 'idle'){
				return key;
			}
		}
	}

	SeatManager.prototype.createSeats = function(maxActor){

		for(var i=0; i< maxActor; i++){
			this.add(i, new Seat(i, this.seatPos[i].x, this.seatPos[i].y));
		}
	}

	SeatManager.prototype.join = function(player){
		var index  = this.getAvailableSeat();
		this.objects[index].sit(player);
		player.seat = this.objects[index];
	}

	SeatManager.prototype.leave = function(seat){
		this.objects[seat.id].leave();
	}

	module.exports = SeatManager;

/***/ },
/* 6 */
/***/ function(module, exports) {

	var GameObjectManager = function(){
		this.objects = {};
		this.current = '';

	}
	GameObjectManager.prototype.constructor = GameObjectManager;

	GameObjectManager.prototype = {
		add : function(key, object){
			this.objects[key] = object;
		},
		remove : function(key){
			delete this.objects[key];
		},
		search : function(key){
			return this.objects[key];
		},
		checkObject : function(key){
			if(this.objects[key]){
				return true;
			}
			else{
				return false;
			}
		},
		update : function(key, object){
			if(this.checkObject(key)){
				this.objects[key] = object;
			}	
		},
		length : function(){
			return Object.keys(this.objects).length;
		}
	}

	module.exports = GameObjectManager;

/***/ },
/* 7 */
/***/ function(module, exports) {

	var Seat = function(id, x, y){
		this.id = id;
		this.state = 'idle';
		this.x = x;
		this.y = y;
		this.player = new Object();
	}

	Seat.prototype.constructor = Seat;
	Seat.prototype = {
		leave : function(){
			this.state = 'idle';
			this.player = new Object();
		},
		sit : function(player){
			this.state = 'use';
			this.player = player;
		}
	}	

	module.exports = Seat;

/***/ },
/* 8 */
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
	 		network.notifyObserver('leave', data);
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
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var Button = __webpack_require__(10);
	var Chat = __webpack_require__(11);
	var Selector = __webpack_require__(13);
	var World = __webpack_require__(14);
	var UIManager = function(){
		this.button = new Button();
		this.chat = new Chat();
		this.selector = new Selector();
		this.world = new World();
		this.roomManager;

	}

	UIManager.prototype.constructor = UIManager;

	UIManager.prototype = {

		set : function(roomManager){
			this.roomManager = roomManager;
			this.button.set(roomManager);
			this.chat.set(roomManager);
			this.selector.set(roomManager);
			this.world.set(roomManager);
		},
		update : function(){
			this.button.update();
			this.chat.update();
			this.selector.update();
			//this.world.update();
		}
	}

	module.exports = UIManager;





/***/ },
/* 10 */
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
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var ChatStyleTag = __webpack_require__(12);
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

			this.normalTag.start = '<p class="white">';
			this.normalTag.end = '</p class="white">';

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
/* 12 */
/***/ function(module, exports) {

	var ChatStyleTag = function(){
		this.startTag = '';
		this.endTag = '';
	}

	ChatStyleTag.prototype.constructor = ChatStyleTag;

	module.exports = ChatStyleTag;


/***/ },
/* 13 */
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
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var PlayerCreator = __webpack_require__(15);

	var World = function(){
			thisWorld = this;
			this.roomManager = new Object();
	 		this.stats = new Stats();
	 		this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
	 		document.body.appendChild(this.stats.dom );
	 		this.scale = 1;
	 		this.low = true;
	 		if(this.low){
	 		  this.scale = 0.5;
	 		}
	 		else{
	 		  this.scale = 1;
	 		}
	 		this.params = {        
	 		  stage: {
	 		    width: window.innerWidth,
	 		    height: window.innerHeight
	 		  },
	 		
	 		  world: {
	 		    width: 1248  * this.scale,
	 		    height: 1024 * this.scale
	 		  },	  
	 		  camera: {
	 		    zoom: 1,
	 		    x:0,
	 		    y:0
	 		  }	  
	 		}

	        rendererOptions = {
	            antialiasing: false,
	            transparent : false,
	            autoResize: true
	        } 

	        this.world = new pixicam.World({
	          screenWidth: this.params.stage.width,
	          screenHeight: this.params.stage.height,
	          width: this.params.world.width,
	          height: this.params.world.height
	        });
	        
	        this.renderer = new PIXI.lights.WebGLDeferredRenderer(this.params.stage.width, this.params.stage.height,rendererOptions);
	        //var renderer = new PIXI.WebGLRenderer(window.innerWidth, window.innerHeight, rendererOptions);
	        zoom = Math.max(this.params.stage.width/this.params.world.width, this.params.stage.height/this.params.world.height);
	        this.stage = new PIXI.Container();
	        this.camera = this.world.camera;
	        this.camera.zoom = zoom;
	        this.stage.addChild(this.world);  
	        this.renderer.view.style.position = "absolute";
	        this.renderer.view.style.top = "0px";
	        this.renderer.view.style.left = "0px";
	        this.movie;
	        document.body.appendChild(this.renderer.view);
	        this.frames = [];
	        this.normal_frames = [];
	        this.playerCreator = new Object();
	        PIXI.loader
	            .add('mafia', 'assets/images/low/mafiamap.png')
	            .add('mafia_normal', 'assets/images/low/mafiamap_NORMALS.png')
	            .add('campfire', 'assets/images/low/campfire.json')
	            .add('campfire_normal', 'assets/images/low/campfire_NORMALS.json')
	            .add('assets/images/mafiaNormal.fnt')
	            .add('assets/images/speechBubble.json')
	            .add('assets/images/low/mafiaCharacter.json')
	            .add('assets/images/low/mafiaCharacter_NORMALS.json')
	            .load(function (loader, res) {
	                var mafiaBackground = new PIXI.Sprite(res.mafia.texture);
	                mafiaBackground.normalTexture = res.mafia_normal.texture;
	                mafiaBackground.setTransform(0, 0);
	                thisWorld.world.addChild(mafiaBackground);             
	                for(var i=0; i<4; i++){
	                    thisWorld.frames.push(PIXI.Texture.fromFrame('campfire '+i+'.ase'));
	                    thisWorld.normal_frames.push(PIXI.Texture.fromFrame('campfire_NORMALS '+i+'.ase'));
	                }

	             	thisWorld.movie = new PIXI.Sprite(thisWorld.frames[0]);
	             	thisWorld.movie.normalTexture = thisWorld.normal_frames[0];
	             	thisWorld.movie.setTransform(0.5*thisWorld.params.world.width, 0.5 * thisWorld.params.world.height);
	             	thisWorld.movie.anchor.set(0.5, 0.5);

	             	thisWorld.world.addChild(thisWorld.movie);

	                thisWorld.world.addChild(new PIXI.lights.AmbientLight(0x110A38, 1));

	                thisWorld.renderer.view.addEventListener("mousedown", thisWorld.mousedown);
	                thisWorld.renderer.view.addEventListener("mouseup", thisWorld.mouseup);
	                thisWorld.renderer.view.addEventListener("mousemove", thisWorld.mousemove);
	                thisWorld.renderer.view.addEventListener("touchstart", thisWorld.touchstart, false);
	                thisWorld.renderer.view.addEventListener("touchmove", thisWorld.touchmove, false);
	                fireLight = new PIXI.lights.PointLight(0xff9933, 3);
	                fireLight.originalX = thisWorld.movie.position.x;
	                fireLight.originalY = thisWorld.movie.position.y;
	                fireLight.position.x = thisWorld.movie.position.x;
	                fireLight.position.y = thisWorld.movie.position.y;
	                thisWorld.playerCreator = new PlayerCreator(thisWorld.world, document); 
	                thisWorld.world.addChild(fireLight);
	                thisWorld.world.update();
	                requestAnimationFrame(thisWorld.animate);      
	        });
	        this.down = false;
	        this.oldX;
	        this.oldY;  
	        this.lastTime = 0;
	        this.i = 0;
	        this.d = new Date();
	        this.lastTime = this.d.getTime();
	        this.light = true;         
	}

	World.prototype.constructor = World;
	World.prototype = {

		set : function(roomManager){
			this.roomManager = roomManager;
		},
	    isTimeToAnimate : function(time, tick){
	        if(time - this.lastTime > tick){
	            this.lastTime = time;
	            return true;
	        }
	        else{
	            return false;
	        }
	    },   
	    animate :function() {
	      thisWorld.stats.begin();
	      d = new Date();
	      time = d.getTime();
	      if(thisWorld.isTimeToAnimate(time, 1000/33)){
	        thisWorld.movie._originalTexture = thisWorld.frames[thisWorld.i%4];
	        thisWorld.movie.normalTexture = thisWorld.normal_frames[thisWorld.i%4];
	        thisWorld.i++;
	        if(thisWorld.i%4 == 0){
	        	thisWorld.i = 0;
	        }
	      }     
	      thisWorld.renderer.render(thisWorld.stage, true);
	      thisWorld.update();
	      thisWorld.world.update();
	      thisWorld.stats.end();
	      requestAnimationFrame(thisWorld.animate);    
	    },
	    mousedown : function(e){
	        thisWorld.down = true;
	        thisWorld.oldX = e.clientX;
	        thisWorld.oldY = e.clientY;
	      console.log(Math.ceil(e.clientX*100/624)+ '/' + Math.ceil(e.clientY*100/512));
	    },
	    mousemove : function(e){
	     if(thisWorld.down == true)
	     {
	      var cameraOldX = thisWorld.camera.x;
	      var cameraOldY = thisWorld.camera.y;
	      thisWorld.camera.x -= e.clientX - thisWorld.oldX;
	      thisWorld.camera.y -= e.clientY - thisWorld.oldY; 
	      thisWorld.camera.x = thisWorld.setCameraBound('x', thisWorld.camera.x, e.clientX - thisWorld.oldX);
	      thisWorld.camera.y = thisWorld.setCameraBound('y', thisWorld.camera.y, e.clientY - thisWorld.oldY);                        
	      thisWorld.oldX = e.clientX;
	      thisWorld.oldY = e.clientY;
	     }
	    },
	    mouseup : function(e){
	        thisWorld.down = false;
	    },
	    touchstart : function(e){
	      document.getElementById("messageBox").blur();
	      var touch = e.touches[0];
	      thisWorld.oldX = touch.pageX;
	      thisWorld.oldY = touch.pageY;
	      //console.log(oldX + '/' + oldY);
	    },
	    touchmove : function (e){
	      //console.log(oldX + '/' + oldY);
	      var touch = e.touches[0];
	      thisWorld.camera.x -= touch.pageX - thisWorld.oldX;
	      thisWorld.camera.y -= touch.pageY - thisWorld.oldY;
	      thisWorld.camera.x = thisWorld.setCameraBound('x', thisWorld.camera.x, touch.pageX - thisWorld.oldX);
	      thisWorld.camera.y = thisWorld.setCameraBound('y', thisWorld.camera.y, touch.pageY - thisWorld.oldY);

	      thisWorld.oldX = touch.pageX;
	      thisWorld.oldY = touch.pageY;
	    },
	    setCameraBound : function(axis, coordinate, moveDirection){
	      if(axis == 'x'){
	        if(coordinate * thisWorld.camera.zoom < thisWorld.params.stage.width/2 && moveDirection > 0){
	          //coordinate = thisWorld.params.stage.width/(2 * thisWorld.camera.zoom);

	        }
	        else if(coordinate > thisWorld.params.world.width  - thisWorld.params.stage.width/2 &&moveDirection < 0){
	       	   //coordinate = (thisWorld.params.world.width  - thisWorld.params.stage.width/2) * thisWorld.camera.zoom+16.5;
	        }
	        return coordinate;
	      }
	      else if(axis == 'y'){
	       
	        if(coordinate * thisWorld.camera.zoom < thisWorld.params.stage.height/2 && moveDirection > 0){
	          //coordinate = thisWorld.params.stage.height/(2 * thisWorld.camera.zoom);

	        }
	        else if(coordinate > thisWorld.params.world.height  - thisWorld.params.stage.height/2&& moveDirection < 0)
	        {
	          //coordinate = (thisWorld.params.world.height  - thisWorld.params.stage.height/2) * thisWorld.camera.zoom+16.5;
	        }
	        return coordinate;
	      }
	    },
	    update : function(){
	    	if(thisWorld.playerCreator.players.children.length != thisWorld.roomManager.room.getPlayerNumber()){
	    		thisWorld.updatePlayer();
	    	}
	    	thisWorld.updateSpeechBubble();
	    },
	    updatePlayer : function(){
	    	thisWorld.playerCreator.removeAll();
	    	console.log('before');
	    	console.log(thisWorld.playerCreator.players);
	    	var seats = thisWorld.roomManager.room.seatManager.objects;
	    	for(key in seats){
	    		if(seats[key].state == 'use'){
	    			var id = seats[key].id;
	    			var x = seats[key].x;
	    			var y = seats[key].y;
	    			var scale = 0.5;
	    			var nickname = seats[key].player.nickname;
	    			var thumbnail = seats[key].player.thumbnail;
	    			thisWorld.playerCreator.createPlayer(id,x,y,nickname,scale,thumbnail);    		
	    		}
	    	}
	    	console.log('after');
	    	console.log(thisWorld.playerCreator.players);
	    },
	    updateSpeechBubble : function(){
	    	var seats = thisWorld.roomManager.room.seatManager.objects;
	    	for(key in seats){
	    		if(seats[key].state == 'use'){
	    			if(seats[key].player.isTalk){
	    				var x = seats[key].x;
	    				var y = seats[key].y;
	    				console.log(x+'/'+y);
	    				var message = seats[key].player.talk;
	    				var scale = 0.5;
	    				var timeout = 1.5;
	    				thisWorld.playerCreator.createSpeechBubble(x,y,message,scale,timeout);
	    				seats[key].player.isTalk = false;
	    			}
	    		}
	    	}
	    }	
	}

	module.exports = World;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var Player = __webpack_require__(16);
	var SpeechBubbleCreator = __webpack_require__(17);

	var PlayerCreator = function(world, document){
		this.players = new PIXI.Container();
		this.world = world;
		this.world.addChild(this.players);
		this.speechBubbleCreator = new SpeechBubbleCreator(this.world);
		this.document = document;
		playerCreator = this;
		this.thumbnails = {};
	}

	PlayerCreator.prototype.constructor = PlayerCreator;

	PlayerCreator.prototype.createPlayerNameTag = function(playerId, x, y, nickname, scale){
	    var  name = new PIXI.extras.BitmapText(playerId+ ' ' + nickname, {font: "22px Normal", alight: "right"});
	    name.setTransform(x+15, y+2.5, scale, scale);

	    var table = new PIXI.Graphics();
	    var nameTag = new PIXI.Container();
	    table.beginFill(0xffffff);
	    table.lineStyle(2, 0x000000);
	    table.drawRect(x, y, (name.textWidth +35)*scale, (name.textHeight+5) *scale);

	    //var thumbnail;
	    //var thumbnailTexture = new PIXI.Texture(new PIXI.BaseTexture(img));
	    //thumbnail = new PIXI.Sprite(thumbnailTexture);
	    //console.log(thumbnailTexture);
	    //thumbnail.setTransform(x+10, y+5, scale, scale);
	    //thumbnail.anchor.set(0.5, 0.5);

	    nameTag.addChild(table);
	    //nameTag.addChild(thumbnail);
	    nameTag.addChild(name);          
	    return nameTag;
	}

	PlayerCreator.prototype.createPlayerSprite = function(playerId, x, y){
		var playerSprite = new PIXI.Sprite(PIXI.Texture.fromFrame('mafiaCharacter '+playerId+'.ase'));
		playerSprite.normalTexture = PIXI.Texture.fromFrame('mafiaCharacter_NORMALS '+playerId+'.ase');

		playerSprite.setTransform(x,y);
		playerSprite.anchor.set(0.5, 0.5);
		return playerSprite;
	}

	PlayerCreator.prototype.createPlayer = function(playerId, x, y, nickname, scale, image){
		var player = new Player(playerId);
		var playerSprite = playerCreator.createPlayerSprite(playerId, x, y);
		player.addChild(playerSprite);
	    //var img = new Image();
	    //if(typeof image === 'undefined'){
	    //	img.src = 'assets/images/no_thumbnail.png';
	    //}
	    //else{
	    //	img.src = image; 
	//
	    //}
	    //img.id = 'thumbnail'+playerId; 
	    //img.style.position = 'absolute';
	    //img.style.top = y * this.world.camera.zoom;
	    //img.style.left = x * this.world.camera.zoom;
	    //img.style.width = '50px';
	    //img.style.height = '50px';              
	    //img.onload = function(){
		//	playerCreator.thumbnails[playerId] = img;	  
		//	document.body.appendChild(img);  
	    //}
	    //img.style.visibility = 'visible';
	    var playerNameTag = playerCreator.createPlayerNameTag(playerId, x, y, nickname, scale);
	  	player.addChild(playerNameTag);	
		playerCreator.players.addChild(player);	

		return player;
	}

	PlayerCreator.prototype.removePlayer = function(playerId){
		var playersIndex = playerCreator.world.getChildIndex(playerCreator.players);
		var players = playerCreator.world.getChildAt(playersIndex);
		for(var i=0; i<players.children.length; i++){
			if(players.children[i].id == playerId){
				return players.removeChildAt(i);
			}
		}
	}

	PlayerCreator.prototype.existPlayer = function(playerId){
		for(var i=0; i<playerCreator.players.children.length; i++){
			if(playerCreator.players.children[i].id == playerId){
				return true;
			}
		}
		return false;
	}

	PlayerCreator.prototype.removeAll = function(){
		var playersIndex = playerCreator.world.getChildIndex(playerCreator.players);
		var players = playerCreator.world.getChildAt(playersIndex);
		players.removeChildren(0, players.children.length);
	}
	PlayerCreator.prototype.createSpeechBubble = function(x, y, message, scale, timeout){
		playerCreator.speechBubbleCreator.create(x, y, message, scale, timeout);
	}
	PlayerCreator.prototype.moveThumbnails = function(x,y){
		for(key in playerCreator.thumbnails){
			console.log(playerCreator.thumbnails[key].id);
			var thumbnail = playerCreator.document.getElementById(playerCreator.thumbnails[key].id);
			thumbnail.style.top = parseInt(thumbnail.style.top) - y + 'px';
			thumbnail.style.left = parseInt(thumbnail.style.left) - x + 'px';
		}
	}
	module.exports = PlayerCreator;

/***/ },
/* 16 */
/***/ function(module, exports) {

	var Player = function(i){
		PIXI.Container.call(this);
		this.id = i;
	}
	Player.prototype.constructor = Player;
	Player.prototype = Object.create(PIXI.Container.prototype);

	module.exports = Player;



/***/ },
/* 17 */
/***/ function(module, exports) {

	var SpeechBubbleCreator = function(world){
		this.world = world;
		speechBubbleCreator = this;
	}

	SpeechBubbleCreator.prototype.constructor = SpeechBubbleCreator;
	SpeechBubbleCreator.prototype = {
		create : function(x, y, message, scale, timeout){
				  var speechBubble = new PIXI.Container();
	              var contents = new PIXI.extras.BitmapText(message, {font: "18px Normal", align: "right"}); 
	              var bubble = new PIXI.Container();
	              var speechBubbleTextures = [];
	              for(var i=0; i < 9; i++){
	                var texture = PIXI.Texture.fromFrame('speechBubble '+i+'.ase');
	                speechBubbleTextures.push(texture);
	              }
	              var sprite = new PIXI.Sprite(speechBubbleTextures[0]);
	              var tileWidth = sprite.width;
	              var tileHeight = sprite.height;
	              var xTileNum = Math.ceil((contents.textWidth - (tileWidth - 5) * 2) / tileWidth)+2;
	              var yTileNum = Math.ceil((contents.textHeight - (tileHeight - 16) * 2) / tileWidth)+2;
	              var xPos = x - xTileNum * tileWidth/2 * scale;
	              var yPos = y- (yTileNum+1) * tileHeight * scale;
	              for(var i=0; i< yTileNum; i++){
	                var spriteSheetColumn = 0
	                if(i == 0){
	                  spriteSheetColumn =0
	                }
	                else if(i == (yTileNum -1)){
	                  spriteSheetColumn = 2;                   
	                }
	                else{
	                  spriteSheetColumn = 1;
	                }
	                for(var j=0; j<xTileNum; j++){
	                  var sprite;
	                  if(j == 0){
	                    sprite = new PIXI.Sprite(speechBubbleTextures[3*spriteSheetColumn + 0]);
	                  }
	                  else if(j == xTileNum -1){
	                    sprite = new PIXI.Sprite(speechBubbleTextures[3*spriteSheetColumn + 2]);
	                  }
	                  else{
	                    sprite = new PIXI.Sprite(speechBubbleTextures[3*spriteSheetColumn + 1]);
	                  }
	                  sprite.setTransform(xPos, yPos, scale, scale);
	                  
	                  bubble.addChild(sprite);
	                  
	                  xPos += tileWidth * scale;
	                }        
	                xPos = x - xTileNum * tileWidth/2 * scale;
	                yPos += tileHeight * scale;
	              }
	              var contentsXPos = x - (xTileNum-1) * tileWidth/2 * scale;
	              var contentsYPos = y - (yTileNum) * tileHeight * scale;
	              contents.setTransform(contentsXPos, contentsYPos, scale, scale);
	              speechBubble.addChild(bubble);
	              speechBubble.addChild(contents);
	              this.world.addChild(speechBubble);
	              setTimeout(function(){speechBubbleCreator.world.removeChild(speechBubble);}, 1000 * timeout);
		}
	}

	module.exports = SpeechBubbleCreator; 

/***/ }
/******/ ]);