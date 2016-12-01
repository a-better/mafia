var ChatStyleTag = require('./chatStyle');
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

