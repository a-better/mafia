var Selector = function(){
	this.roomManager = {};
	this.livePlayers = [];
}

Selector.prototype = Selector;

Selector.prototype = {

	set : function(roomManager){
		this.roomManager = roomManager;
		this.livePlayers = this.roomManager.room.getLivePlayers();
		$('#selectorModal').hide();
	},
	update : function(){
		if(this.livePlayers.length > 0 && this.livePlayers.length != this.roomManager.room.getLivePlayers().length){
			this.livePlayers  = this.roomManager.room.getLivePlayers();
			$('#selector').empty();
			for(var i=0; i<this.livePlayers.length; i++){
				debug.log("LOG", 'selector 26 :' + this.livePlayers.length);
				var player;
				if(this.livePlayers[i] == this.roomManager.room.myPlayer.id){
					player = this.roomManager.room.myPlayer;
				}
				else{
					player = this.roomManager.room.players[this.livePlayers[i]];	
				}
				debug.log("LOG", 'radio actor ' + player);
				$('#selector').append('<input type="radio" name="selector" value="'+this.livePlayers[i]+'">'+player.nickname);
			}	
		}
	}
}


module.exports = Selector;