var Citizen = require('../citizen');
var Doctor = function(id){
	Citizen.call(this, id);
	this.enableSave = true;
	this.haveSkill = true;
}

Doctor.prototype.constructor = Doctor;
Doctor.prototype = Object.create(Citizen.prototype);

module.exports = Doctor;
