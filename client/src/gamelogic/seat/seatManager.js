var GameObjectManager = require('../../../core/gameObject/gameObjectManager');
var Seat = require('./seat');
var SeatManager = function(){
	GameObjectManager.call(this);
	GAME_WIDTH = 1248 * 0.5;
	GAME_HEIGHT = 1024 * 0.5;
	this.seatPos = [
		{
			x: GAME_WIDTH * 0.71,
			y: GAME_HEIGHT * 0.51
		},
		{
			x: GAME_WIDTH * 0.64,
			y: GAME_HEIGHT * 0.31
		},
		{
			x: GAME_WIDTH * 0.36,
			y: GAME_HEIGHT * 0.36
		},
		{
			x: GAME_WIDTH * 0.75,
			y: GAME_HEIGHT * 0.39
		},
		{
			x: GAME_WIDTH * 0.51,
			y: GAME_HEIGHT * 0.66 
		},
		{
			x: GAME_WIDTH * 0.64,
			y: GAME_HEIGHT * 0.69 
		},
		{
			x: GAME_WIDTH * 0.39,
			y: GAME_HEIGHT * 0.51
		},
		{
			x: GAME_WIDTH * 0.43,
			y: GAME_HEIGHT *0.86
		},
		{
			x:GAME_WIDTH * 0.46,
			y: GAME_HEIGHT *0.66
		},
		{
			x: GAME_WIDTH * 0.78,
			y: GAME_HEIGHT * 0.9
		},																		
	]
}

SeatManager.prototype.constructor = SeatManager;
SeatManager.prototype = Object.create(GameObjectManager.prototype);
SeatManager.prototype.getAvailableSeat = function(){
	for(key in this.objects){
		if(this.objects[key].state == 'idle'){
			return key;
		}
	}
}

SeatManager.prototype.createSeats = function(maxActor){

	for(var i=0; i< maxActor; i++){
		this.add(i, new Seat(i, this.seatPos[i].x, this.seatPos[i].y));
	}
}

SeatManager.prototype.join = function(player){
	var index  = this.getAvailableSeat();
	this.objects[index].sit(player);
	player.seat = this.objects[index];
}

SeatManager.prototype.leave = function(seat){
	this.objects[seat.id].leave();
}

module.exports = SeatManager;