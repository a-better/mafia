var Citizen = require('../citizen');
var Spy = function(id){
	Citizen.call(this, id);
	this.isMafia = true;
	this.contacted = false;
	this.haveSkill = true;
	this.enableDetect = true;
}

Spy.prototype.constructor = Spy;
Spy.prototype = Object.create(Citizen.prototype);
Spy.prototype.contact = function(){
	this.contacted = true;
}

module.exports = Spy;