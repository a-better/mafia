var GameObjectManager = require('./gameObjectManager');
var Actor = require('./actor');
var ActorManager = function(){
	GameObjectManager.call(this);
}
ActorManager.prototype = Object.create(GameObjectManager.prototype);
ActorManager.prototype.constructor = ActorManager;

ActorManager.prototype.add = function(id, nickname, thumbnail){
	var actor =  new Actor(id, nickname, thumbnail);
	this.objects[id] = actor;
}
ActorManager.prototype.remove = function(id){
	delete this.objects[id];
}
ActorManager.prototype.length = function(){
	return Object.keys(this.objects).length;
}

module.exports = ActorManager;
