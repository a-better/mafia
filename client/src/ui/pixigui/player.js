var Player = function(i){
	PIXI.Container.call(this);
	this.id = i;
}
Player.prototype.constructor = Player;
Player.prototype = Object.create(PIXI.Container.prototype);

module.exports = Player;

