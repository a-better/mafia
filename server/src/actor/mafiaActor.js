var Actor = require('../../core/objects/actor');
var MafiaActor = function(id, nickname, thumbnail){
	Actor.call(this, id,  nickname, thumbnail);
	this.state = new Object();
}

MafiaActor.prototype.constructor =  MafiaActor;
MafiaActor.prototype = Object.create(Actor.prototype);

MafiaActor.prototype.setJob = function(state){
	this.state = state;
}

MafiaActor.prototype.getJob = function(){
	return this.state;
}
module.exports = MafiaActor;