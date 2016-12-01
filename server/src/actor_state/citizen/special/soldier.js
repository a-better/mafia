var Citizen = require('../citizen');
var Soldier = function(id){
	Citizen.call(this, id);
	this.haveSkill = true;
	this.armor = true;
}

Soldier.prototype.constructor = Soldier;
Soldier.prototype = Object.create(Citizen.prototype);

Soldier.prototype.killed = function(){
	if(this.armor == true){
		this.armor = false;
		this.save = true;
		this.avoidKill = true;
	}
	else{
		if(this.save == true){
			this.dead = false;
		}
		else{
			this.dead = true;
		}
	}
}
Soldier.prototype.saved = function(){
	if(this.armor == false){
		this.save = true;
		if(this.dead == true){
			this.dead = false;
		}
	}
}

Soldier.prototype.detected = function(){
	return this.id;
}

module.exports = Soldier;