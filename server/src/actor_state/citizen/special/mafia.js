var Citizen = require('../citizen');
var Mafia = function(id){
	Citizen.call(this, id);
	this.enableKill = true;
	this.isMafia = true;
	this.haveSkill = true;
}

Mafia.prototype.constructor = Mafia;
Mafia.prototype = Object.create(Citizen.prototype);

module.exports = Mafia;