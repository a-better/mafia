
var Button = function(){
	this.roomManager = {};
	this.detectButton = false;
	this.voteButton = false;
	this.saveButton = false;
	this.killButton = false;

	this.startButton = false;

	this.buttonId = '';

	button = this;
}

Button.prototype.constructor = Button;

Button.prototype = {
	set : function(roomManager){
		this.roomManager = roomManager;
		debug.log("LOG", 'button'+this.roomManager);
		$('#startButton').hide();
		$('#killButton').hide();
		$('#voteButton').hide();
		$('#saveButton').hide();
		$('#detectButton').hide();

		var roomId = this.roomManager.room.roomId;

		$('#startButton').click(function(){
			debug.log("LOG", button.roomManager);
			button.roomManager.network.start(roomId);
		});
		$('.skillButton').click(function(){
			button.buttonId = $(this).data('id');
		});
		$('#selectButton').click(function(){
			var target = $('input[name="selector"]:checked').val();

			$('#selectorModal').modal('hide');

			switch(button.buttonId){
				case 'kill':
					button.roomManager.network.kill(roomId, button.roomManager.room.myPlayer.id, target);	
					break;
				case 'vote':
					button.roomManager.network.vote(roomId, button.roomManager.room.myPlayer.id,target);
					this.roomManager.room.myPlayer.enableVote = false;		
					break;
				case 'save':
					button.roomManager.network.save(roomId, button.roomManager.room.myPlayer.id, target);					
					break;
				case 'detect':
					button.roomManager.network.detect(roomId, button.roomManager.room.myPlayer.id,target);					
					break;			
			}
		});

		$('#agreeButton').click(function(){
			button.roomManager.network.judge(roomId, button.roomManager.room.myPlayer.id,'agree');
		});

		$('#disagreeButton').click(function(){
			button.roomManager.network.judge(roomId, button.roomManager.room.myPlayer.id,'disagree');	
		});		
		
	},
	update : function(){
		debug.log("LOG", 'minActor' + this.roomManager.room.minActor);
		this.updateStartButton();
		this.updateSkillButton();
		
	},
	updateStartButton : function(){
		if(this.roomManager.room.myPlayer.host && this.roomManager.room.getPlayerNumber() >= this.roomManager.room.minActor){
			debug.log("LOG", 'start Button :' + this.startButton + this.roomManager.room.getPlayerNumber()+this.roomManager.room.playing);
			if(this.roomManager.room.playing == false ){
				$('#startButton').show();
			}
			else{
				$('#startButton').hide();
			}
		}		
	},
	updateSkillButton : function(){
		if(this.roomManager.room.myPlayer.dead){
			$('#voteButton').hide();
			$('#detectButton').hide();
			$('#killButton').hide();
			$('#saveButton').hide();

			$('#agreeButton').hide();
			$('#disagreeButton').hide();				
		}
		else{
			if(this.roomManager.room.state == 'day'){
				$('#agreeButton').hide();
				$('#disagreeButton').hide();

				if(this.roomManager.room.myPlayer.enableVote){
					$('#voteButton').show();
					$('#detectButton').hide();
					$('#killButton').hide();
					$('#saveButton').hide();		
				}
				else{
					$('#voteButton').hide();
					$('#detectButton').hide();
					$('#killButton').hide();
					$('#saveButton').hide();
				}
			}
			else if(this.roomManager.room.state == 'night'){
				$('#voteButton').hide();
				$('#agreeButton').hide();
				$('#disagreeButton').hide();	
				if(this.roomManager.room.myPlayer.enableDetect){
					$('#detectButton').show();
				}
				else{
					$('#detectButton').hide();
				}
		
				if(this.roomManager.room.myPlayer.enableKill){
					$('#killButton').show();
				}
				else{
					$('#killButton').hide();
				}
		
				if(this.roomManager.room.myPlayer.enableSave){
					$('#saveButton').show();
				}
				else{
					$('#saveButton').hide();
				}
			}
			else if(this.roomManager.room.state == 'lastSpeech'){
				$('#voteButton').hide();
				$('#detectButton').hide();
				$('#killButton').hide();
				$('#saveButton').hide();

				$('#agreeButton').show();
				$('#disagreeButton').show();				
			}
			else if(this.roomManager.room.state == 'idle'){
				$('#voteButton').hide();
				$('#detectButton').hide();
				$('#killButton').hide();
				$('#saveButton').hide();

				$('#agreeButton').hide();
				$('#disagreeButton').hide();				
			}
		}	
	}
}

module.exports = Button;
