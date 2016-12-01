var ActorManager = require('../../core/objects/actorManager');
var MafiaActor = require('./mafiaActor');
var Array = require('../../core/utils/array');
var MafiaStateFactory = require('../factory/mafiaStateFactory');
var Debug = require('../../core/debug/debug');
var MafiaActorManager = function(){	
	ActorManager.call(this);
	this.mafiaNum = 2;
	this.policeNum = 1;
	this.doctorNum = 1;
	this.spyNum = 1;
	this.soldierNum =1;

	this.mafiaStateId = 'mafia';
	this.policeStateId = 'police';
	this.doctorStateId = 'doctor';
	this.spyStateId = 'spy';
	this.soldierStateId = 'soldier';
	this.citizenStateId = 'citizen';

	this.mafiaStateFactory = new MafiaStateFactory({'mafia' : this.mafiaStateId, 
		'police' : this.policeStateId, 
		'doctor' : this.doctorStateId,
		'citizen' : this.citizenStateId,
		'spy' : this.spyStateId,
		'soldier' : this.soldierStateId
		});
	this.debug = new Debug({'debug': true});

	this.killedCitizen = '';
	mafiaActorManager = this;
}

MafiaActorManager.prototype.constructor = MafiaActorManager;

MafiaActorManager.prototype = Object.create(ActorManager.prototype);

MafiaActorManager.prototype.reset = function(){
	this.killedCitizen = '';
	for(key in this.objects){
		this.objects[key].state.reset();
	}
}

MafiaActorManager.prototype.add = function(id, nickname, thumbnail){
	var actor =  new MafiaActor(id, nickname, thumbnail);
	this.objects[id] = actor;
	this.objects[id].setJob(this.mafiaStateFactory.actorState(this.citizenStateId));
}

MafiaActorManager.prototype.setActorState = function(min){

	if(Object.keys(this.objects).length >= min){
		var keys = Object.keys(this.objects);
		this.setMafia(keys);
		this.setPolice(keys);	
		this.setDoctor(keys);
		this.setSpy(keys);	
		this.setSoldier(keys);	
		this.setCitizen(keys);
		for (key in this.objects){
			//this.debug.log("LOG", mafiaActorManager.objects[key]);
		}	
	}
}
MafiaActorManager.prototype.setMafia = function(keys){
	var mafiaKeys = keys.random(this.mafiaNum);
	for(var i=0; i<this.mafiaNum; i++){
		this.objects[mafiaKeys[i]].setJob(this.mafiaStateFactory.actorState(this.mafiaStateId));
	}
}
MafiaActorManager.prototype.setPolice = function(keys){
	var policeKeys = keys.random(this.policeNum);
	for(var i=0; i<this.policeNum; i++){
		this.objects[policeKeys[i]].setJob(this.mafiaStateFactory.actorState(this.policeStateId));
	}
}
MafiaActorManager.prototype.setDoctor = function(keys){
	var doctorKeys = keys.random(this.doctorNum);
	for(var i=0; i<this.doctorNum; i++){
		this.objects[doctorKeys[i]].setJob(this.mafiaStateFactory.actorState(this.doctorStateId));
	}
}

MafiaActorManager.prototype.setSpy = function(keys){
	var spyKeys = keys.random(this.spyNum);
	for(var i=0; i<this.spyNum; i++){
		this.objects[spyKeys[i]].setJob(this.mafiaStateFactory.actorState(this.spyStateId));
	}	
}

MafiaActorManager.prototype.setSoldier = function(keys){
	var soldierKeys = keys.random(this.soldierNum);
	for(var i=0; i<this.soldierNum; i++){
		this.objects[soldierKeys[i]].setJob(this.mafiaStateFactory.actorState(this.soldierStateId));
	}	
}
MafiaActorManager.prototype.setCitizen = function(keys){
	for(var i=0; i<keys.length; i++){
		this.objects[keys[i]].setJob(this.mafiaStateFactory.actorState(this.citizenStateId));
	}
}

MafiaActorManager.prototype.mafiaAlive = function(){
	var alive = true;
	return alive;
}


MafiaActorManager.prototype.vote = function(actor, target){
	this.objects[actor].state.voteTo = target;
	this.objects[target].state.voted();
}

MafiaActorManager.prototype.selectMostVotedActor = function(){
	var selectedActor;
	var keys = Object.keys(this.objects); 
	var mostVote = 0;
	var current = 0;
	var repeatition = 0;
	for(key in this.objects){
		current = this.objects[key].state.vote;
		if(mostVote == current){
			repeatition++;
		}
		if(mostVote < current){
			selectedActor = this.objects[key].id;
			mostVote = current;
			repeatition = 1;
		}	
	}
	if(repeatition == 1){
		return selectedActor;
	}	
}

MafiaActorManager.prototype.killCitizen = function(){
	//밤이 끝날때 의사와 마피아의 결정을 모두 확인후 함수 호출. 
	//각 상황마다 일종의 코드를 반환하는 식으로 변경 
	//mafia, doctor
	this.objects[this.killedCitizen].state.killed();
	if(this.isDead(this.killedCitizen)){
		return true;
	}
	else if(this.isSave(this.killedCitizen)){
		return false;
	}
}
MafiaActorManager.prototype.killVotedCitizen = function(target){
	var judgeResult = this.getCurrentCandidateJudge();
	if(judgeResult.agree > judgeResult.disagree){
		this.objects[target].state.dead = true;
		return true;		
	}
	else{
		return false;
	}
}

MafiaActorManager.prototype.isSoldier = function(actor){
	if(this.objects[actor].state.key == this.soldierStateId){
		return true;
	}
	else{
		return false;
	}
}

MafiaActorManager.prototype.isAvoidKill = function(actor){
	return this.objects[actor].state.avoidKill;
}

MafiaActorManager.prototype.detectCitizen = function(actor){
	//detect는 밤이 끝날때가 아니라 즉시 가능. 
	//actor의 state와 target의 actor를 반환 
	//spy,police
	var detectedJob;
	if(this.isActorJob(actor, this.policeStateId)){
		if(this.isActorJob(this.objects[actor].state.skillTo, this.mafiaStateId)){
			detectedJob = this.mafiaStateId;
		}
	}

	if(this.isActorJob(actor, this.spyStateId)){
		if(this.objects[actor].state.contacted == false){
			if(this.isActorJob(this.objects[actor].state.skillTo, this.mafiaStateId)){
				detectedJob = this.mafiaStateId;
			}
		}
		else{
			var target = this.objects[actor].state.skillTo;
			detectedJob = this.getJob(target);
		}
	}

	return detectedJob;
}

MafiaActorManager.prototype.getJob = function(target){
	return this.objects[target].state.key;
}
MafiaActorManager.prototype.setSkillTarget = function(actor, target){
	this.objects[actor].state.setSkillTarget(target);

	if(this.isMafia(actor)){
		this.killedCitizen = target;
	}
	if(this.isActorJob(actor, this.doctorStateId)){
		this.objects[target].state.saved();
	}

}
MafiaActorManager.prototype.isActorJob = function(actor, state){
	if(this.objects[actor].getJob().key == state){
		return true;
	}
	else{
		return false;
	}
}

MafiaActorManager.prototype.isSave = function(target){
	return this.objects[target].state.save;
}
MafiaActorManager.prototype.isDead = function(actor){
	return this.objects[actor].state.dead;
}
MafiaActorManager.prototype.isMafia = function(actor){
	if(this.objects[actor].state.key == 'mafia' && this.objects[actor].state.dead == false){
		return true;
	}
	else{
		return false;
	}
}
MafiaActorManager.prototype.getActorByState = function(stateId){
	var array = [];
	var keys = Object.keys(this.objects); 
	for(key in this.objects){
		if(this.objects[key].state.key == stateId && this.objects[key].state.dead == false){
			array.push(this.objects[key]);
		}
	}
	return array;
}
MafiaActorManager.prototype.getMafiaActors = function(){
	var array = [];
	for(key in this.objects){
		if(this.objects[key].state.isMafia && this.objects[key].state.dead == false){
			array.push(this.objects[key]);
		}
	}
	return array;
}
MafiaActorManager.prototype.getMafiaAndSpy = function(){
	var mafias = this.getActorByState('mafia');
	var spys = this.getActorByState('spy'); 
	for(var i=0; i<spys.length; i++){
		this.debug.log("LOG", 'mafiaActorManager 253 : '+spys[i].id + this.objects[spys[i]]);
		if(this.objects[spys[i].id].state.contacted == true){
			mafias.push(spys[i]);
		}
	} 
	return mafias;
}
MafiaActorManager.prototype.getLiveActors = function(){
	var array = [];
	for(key in this.objects){
		if(!this.objects[key].state.dead){
			array.push(this.objects[key]);
		}
	}
	return array;
}

MafiaActorManager.prototype.getDeadActors = function(){
	var array = [];
	for(key in this.objects){
		if(this.objects[key].state.dead){
			array.push(this.objects[key]);
		}
	}
	return array;
}

MafiaActorManager.prototype.getNickname = function(actorId){
	this.debug.log("LOG", actorId + this.objects[actorId]);
	return this.objects[actorId].nickname;
}

MafiaActorManager.prototype.setAgreeToCandidateJudge = function(actorId){
	this.objects[actorId].state.agree();
}

MafiaActorManager.prototype.setDisagreeToCandidateJudge = function(actorId){
	this.objects[actorId].state.disagree();
}

MafiaActorManager.prototype.getCurrentCandidateJudge = function(){
	var agree = 0;
	var disagree = 0;
	var liveActors = this.getLiveActors();
	for(var i=0; i < liveActors.length; i++){
		if(this.objects[liveActors[i].id].state.agreed == -1){
			disagree++;
		}
		else if(this.objects[liveActors[i].id].state.agreed == 1){
			agree++;
		}
	}
	return {'agree' : agree, 'disagree' : disagree};	
}

module.exports = MafiaActorManager;