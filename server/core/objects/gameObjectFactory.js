var Actor = require('./actor');
var Room = require('./room');
var GameObjectFactory = function(){

}

GameObjectFactory.prototype.constructor = GameObjectFactory;

GameObjectFactory.prototype = {
	actor : function(id, nickname, thumbnail){
		return new Actor(id, nickname, thumbnail);
	},
	room : function(key, object, maxActor, minActor){
		return new Room(key, object, maxActor, minActor);
	}
}
module.exports = GameObjectFactory;