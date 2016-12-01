var GameObjectFactory = require('../../core/objects/gameObjectFactory');
var MafiaRoom = require('../room/mafiaRoom');
var MafiaObjectFactory = function(){

}

MafiaObjectFactory.prototype.constructor = MafiaObjectFactory;
MafiaObjectFactory.prototype = Object.create(GameObjectFactory.prototype);

MafiaObjectFactory.prototype.mafiaRoom = function(id, max, min, platformServerId, url){
	return new MafiaRoom(id, max, min, platformServerId, url);
}

module.exports = MafiaObjectFactory;
