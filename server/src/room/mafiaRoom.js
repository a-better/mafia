var Room = require('../../core/objects/room');
var MafiaActorManager = require('../actor/mafiaActorManager');
var Debug = require('../../core/debug/debug');
var MafiaRoom = function(id, max, min, platformServerId, url){
	Room.call(this, id, max, min);
	this.platformServerId = platformServerId;
	this.url = url;
	this.actorManager = new MafiaActorManager();
	this.debug = new Debug({'debug': true});
	this.hostId = '';
	this.network ={};

}

MafiaRoom.prototype.constructor = MafiaRoom;
MafiaRoom.prototype = Object.create(Room.prototype);

MafiaRoom.prototype.setHostClient = function(){
	var keys = Object.keys(this.actorManager.objects);
	this.hostId = keys[0];
	this.network.setHost(this.hostId);
}

MafiaRoom.prototype.setState = function(stateFactory){
	this.minActor = 8;
	this.maxActor = 10;
	var idle = stateFactory.idle();
	this.stateManager.add('idle', idle, true);

	var day = stateFactory.roomState('day');
	var night = stateFactory.roomState('night');
	var lastSpeech = stateFactory.roomState('lastSpeech');
	this.stateManager.add('day', day);
	this.stateManager.add('lastSpeech', lastSpeech);
	this.stateManager.add('night', night);
}

MafiaRoom.prototype.setNetwork = function(network){
	this.network = network;
}

MafiaRoom.prototype.reset = function(){
	this.stateManager.states['day'].count = 0;
	this.stateManager.states['night'].count = 0;
	this.stateManager.states['lastSpeech'].count = 0;
	this.stateManager.states['lastSpeech'].candidate = '';
	this.actorManager.reset();
}
MafiaRoom.prototype.setActorState = function(){
	this.actorManager.setActorState(this.minActor);
	var keys = Object.keys(this.actorManager.objects);
	for(var i=0; i<keys.length; i++){
		this.debug.log("LOG", "플레이어"+keys[i]+"의 직업은"+this.actorManager.getJob(keys[i]));
		this.network.setJob(this.id, keys[i], this.actorManager.getJob(keys[i]));
	}
}
MafiaRoom.prototype.join= function(id, nickname, thumbnail){
	this.actorManager.add(id, nickname, thumbnail);
	if(this.actorManager.length() == 1){
		this.setHostClient();
		this.debug.log("LOG", "호스트는 "+this.hostId+"입니다.");
		this.network.sendNotice(this.id,"호스트는 "+this.hostId+"입니다.");

	}
}
MafiaRoom.prototype.leave = function(id){
	this.actorManager.remove(id);
	if(this.actorManager.length() > 0 && id == this.hostId){
		this.setHostClient();	
		this.debug.log("LOG", "호스트가 "+ this.hostId+"로 변경되었습니다.");
		this.network.sendNotice(this.id,"호스트는 "+this.hostId+"입니다.");		
	}
	if(this.checkEndCondition()){
		this.end();
	}
}
MafiaRoom.prototype.start = function(room){
	if(this.stateManager.current == 'idle'){
		this.reset();
		this.setActorState();
		this.stateManager.changeState('night');
		this.network.changeState(this.id, 'night');
		this.stateManager.getCurrentState().count++;
		this.game = setTimeout(function(){room.toggleDayNight(room)}, this.stateManager.getCurrentState().time * 1000);
	}
}
MafiaRoom.prototype.end = function(){
	clearTimeout(this.game);
	this.stateManager.changeState('idle');
	this.network.changeState(this.id, 'idle');
}
MafiaRoom.prototype.checkEndCondition = function(){
	var mafiaTeamNum = this.actorManager.getMafiaActors().length;
	var mafiaNum = this.actorManager.getActorByState('mafia').length;
	var citizenNum = this.actorManager.getLiveActors().length - mafiaTeamNum;

	if(mafiaTeamNum >= citizenNum && this.stateManager.current != 'idle'){
		this.debug.log("LOG", "마피아 승리");
		this.end();
		this.network.end(this.id, 'mafia');
	} 
	else if(mafiaNum == 0 && this.stateManager.current != 'idle'){
		this.debug.log("LOG", "시민 승리");
		this.end();
		this.network.end(this.id, 'citizen');
	}

}
MafiaRoom.prototype.toggleDayNight = function(room){
	var time;
	this.debug.log("LOG", this.stateManager.current + this.stateManager.getCurrentState().count);
	if(this.stateManager.current == 'night'){
		this.kill();
		this.actorManager.reset();
		this.stateManager.changeState('day');
		this.network.changeState(this.id, 'day');
		time = this.dayTime;
	}
	else if(this.stateManager.current == 'day'){
		var candidate = this.actorManager.selectMostVotedActor();			
		if(typeof candidate === "undefined"){
			this.debug.log("LOG", "투표 무효");
			this.network.broadcastNotice(this.id,"투표가 무효로 되었습니다.");	
			this.actorManager.reset();
			this.stateManager.changeState('night');
			this.network.changeState(this.id, 'night');		
		}
		else{
			var nickname = this.actorManager.getNickname(candidate);
			this.network.broadcastNotice(this.id, nickname + "의 최종변론 시간입니다.");	
			this.stateManager.changeState('lastSpeech');
			this.stateManager.getCurrentState().candidate = candidate;
			this.network.changeState(this.id, 'lastSpeech');
		}

	}
	else if(this.stateManager.current == 'lastSpeech'){
		var candidate = this.stateManager.getCurrentState().candidate;	
		if(this.actorManager.killVotedCitizen(candidate))
		{		
			this.debug.log("LOG", candidate + "가 투표로 제거");
			var nickname = this.actorManager.objects[candidate].nickname;
			this.network.broadcastNotice(this.id, nickname + "가 투표로 제거");	
			this.network.dead(this.id, candidate);
		}
		else{
			this.network.broadcastNotice(this.id,"투표가 무효로 되었습니다.");	
		}
		this.actorManager.reset();
		this.stateManager.changeState('night');
		this.network.changeState(this.id, 'night');	
	}
	this.stateManager.getCurrentState().count++;
	clearTimeout(this.game);
	
	this.game = setTimeout(function(){room.toggleDayNight(room)}, this.stateManager.getCurrentState().time * 1000);
	this.checkEndCondition();
}

MafiaRoom.prototype.useSkill = function(actor, target){
	//사람 감지 는 바로 반환 필요 
	//사람을 죽이는 능력은 밤이 끝날떄 결과를 처리 
	this.debug.log("LOG", 'mafiaroom 143'+actor + '/' + target);
	if(this.enableSkill(actor, target)){
		this.actorManager.setSkillTarget(actor, target);
		this.network.sendNotice(this.id, actor, this.actorManager.getNickname(target)+"에게 스킬을 사용하였습니다.");
		this.detect(actor, target);
	}
}
MafiaRoom.prototype.kill = function(){
	var result;
	var target = this.actorManager.killedCitizen;
	if(target){
		result = this.actorManager.killCitizen();
		if(result){
			this.debug.log("LOG", this.actorManager.killedCitizen +"마피아에 의해 사망");
			this.network.broadcastNotice(this.id,this.actorManager.getNickname(this.actorManager.killedCitizen) +"마피아에 의해 사망");
			this.network.dead(this.id, this.actorManager.killedCitizen);
		}
		else{
			if(this.actorManager.isAvoidKill(target) && this.actorManager.isSoldier(target)){
				this.debug.log("LOG", "군인 킬 회피");
				this.network.broadcastNotice(this.id,this.actorManager.getNickname(this.actorManager.killedCitizen) +"군인 킬 회피");
			}
			else{
				this.debug.log("LOG", "화타");
				this.network.broadcastNotice(this.id,this.actorManager.getNickname(this.actorManager.killedCitizen) +"화타");
			}
		}
		
	}
	else{
		this.debug.log("LOG", "마피아 선택 X");
		this.network.broadcastNotice(this.id, "오늘 밤은 아무도 죽지 않았습니다.");
	}
}
MafiaRoom.prototype.vote = function(actor, target){
	if(this.stateManager.current == 'day'){
		this.actorManager.vote(actor, target);
		var vote = this.actorManager.objects[target].state.vote;
		var message = this.actorManager.getNickname(target) +"이" + vote + '표 획득'; 
		this.network.broadcastNotice(this.id, message);
	}
	else{
		this.network.sendNotice(actor, target,'투표 할 수 없습니다.');
	}
}
MafiaRoom.prototype.detect = function(actor, target){
	var detectedJob;
	var actorJob = this.actorManager.getJob(actor); 
	var actorNickname = this.actorManager.getNickname(actor);
	var targetNickname = this.actorManager.getNickname(target);
	this.debug.log('LOG', actorJob);
	switch(actorJob){
		case 'spy':
			detectedJob = this.actorManager.detectCitizen(actor);
			if(detectedJob){
				if(this.actorManager.objects[actor].state.contacted == false){
					this.debug.log('LOG', target+"의 직업은 마피아입니다. 당신은 마피아팀");
					this.network.sendNotice(actor, target, target+"의 직업은 마피아입니다. 당신은 마피아팀이 되었습니다.");
					this.actorManager.objects[actor].state.contact();
				}
				else{
					this.debug.log('LOG', target+"의 직업은"+detectedJob);
					this.network.sendNotice(actor, target, targetNickname+"의 직업은" + detectedJob);
				}
			}
			if(this.actorManager.isSoldier(target)){
				this.debug.log('LOG', '군인이 스파이를 감지함');
				this.debug.log('LOG', target+"의 직업은 "+detectedJob);
				this.debug.log('LOG', actor+"의 직업은 스파이");
				this.network.sendNotice(actor, target, targetNickname+"의 직업은" + detectedJob);	
				this.network.sendNotice(target, actor, "스파이를 감지함 스파이는 "+actorNickname);

			}
			break;
		case 'police':
			debug.log("LOG", actor);
			detectedJob = this.actorManager.detectCitizen(actor);
			if(detectedJob){
				this.debug.log('LOG', target+"의 직업은 마피아입니다.");
				this.network.sendNotice(actor, target, targetNickname+"의 직업은 마피아입니다.");
			}			
			break;
	}

}

MafiaRoom.prototype.enableSkill = function(actor, target){
	var actorJob = this.actorManager.getJob(actor); 
	if(this.stateManager.current == 'night'){
		if(actorJob == 'doctor' && actor == target){
			if(this.stateManager.getCurrentState().count == 1){
				this.debug.log('LOG', '첫 밤 자힐 가능');
				return true;
			}
			else{
				this.network.sendNotice(actor, target,'첫날밤 이후 로 자기 자신을 치료 할 수 없습니다.');
				return false;			
			}
		}
		else{
			return true;
		}
	}
	else{
		this.network.sendNotice(actor, target,'스킬을 쓸 수 없습니다.');
		return false;		
	}
}

MafiaRoom.prototype.judge = function(actor, judge){
	this.debug.log("LOG", 'mafiaRoom + 273' + judge);
	if(judge == 'agree'){
		this.actorManager.setAgreeToCandidateJudge(actor);
	}
	else if(judge == 'disagree'){
		this.actorManager.setDisagreeToCandidateJudge(actor);
	}
	var judgeResult = this.actorManager.getCurrentCandidateJudge();
	this.network.judge(this.id, judgeResult);
}
MafiaRoom.prototype.isPlaying = function(){
	if(this.stateManager.current == 'day' || this.stateManager.current == 'night'){
		return true;
	}
	else{
		return false;
	}
}
MafiaRoom.prototype.isOverMaximumActor = function(){
	if(this.actorManager.length >= this.maxActor){
		return true;
	}
	else{
		false;
	}
}


module.exports = MafiaRoom;