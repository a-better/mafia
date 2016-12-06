var Seat = function(id, x, y){
	this.id = id;
	this.state = 'idle';
	this.x = x;
	this.y = y;
	this.player = new Object();
}

Seat.prototype.constructor = Seat;
Seat.prototype = {
	leave : function(){
		this.state = 'idle';
		this.player = new Object();
	},
	sit : function(player){
		this.state = 'use';
		this.player = player;
	}
}	

module.exports = Seat;