var State = require('../../../core/state/state');
var Citizen = function(id){
	State.call(this, id);
	this.dead = false;
	this.save = false;
	this.enableSkill = true;

	this.enableKill = false;
	this.enableSave = false;
	this.enableDetect = false;

	this.avoidKill = false; 
	this.haveSkill = false;
	this.isMafia = false;
	this.skillTo = '';
	this.voteTo = '';
	this.vote = 0;

	this.agreed = 0;
}

Citizen.prototype.constructor = Citizen;

Citizen.prototype = Object.create(State.prototype);

Citizen.prototype.reset = function(){
	this.skillTo = '';
	this.voteTo = '';
	this.vote = 0;
	this.enableSkill = true;
	this.save = false;
	this.avoidKill = false;
	this.agreed = 0;
}

Citizen.prototype.voted = function(){
	if(this.dead == false){
		this.vote++;
	}	
}
Citizen.prototype.killed = function(){	
	if(this.save == true){
		this.dead = false;
	}
	else{
		this.dead = true;
	}
}
Citizen.prototype.saved = function(){
	this.save = true;
	if(this.dead == true){
		this.dead = false;
	}
}
Citizen.prototype.detected = function(){
	return this.id;
}

Citizen.prototype.setSkillTarget = function(actorId){
	if(this.haveSkill == true && this.dead == false && this.enableSkill == true){
		this.skillTo = actorId;	
	}
}

Citizen.prototype.agree = function(){
	this.agreed = 1;
}

Citizen.prototype.disagree = function(){
	this.agreed = -1;
}

module.exports = Citizen;