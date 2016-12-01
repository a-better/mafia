var GameObject = require('./gameObject');
var Actor = function(id, nickname, thumbnail){
	GameObject.call(this, id);
	if(typeof nickname == 'undefined'){
		this.nickname = '';
	}
	else{
		this.nickname = nickname;
	}
	
	if(typeof thumbnail == 'undefined'){
		this.thumbnail = '';
	}
	else{
		this.thumbnail = thumbnail;
	}
}
Actor.prototype = Object.create(GameObject.prototype);
Actor.prototype.constructor = Actor;

module.exports = Actor;