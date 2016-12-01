var Citizen = require('../citizen');
var Police = function(id){
	Citizen.call(this, id);
	this.enableDetect = true;
	this.haveSkill = true;
}

Police.prototype.constructor = Police;
Police.prototype = Object.create(Citizen.prototype);

module.exports = Police;