var Button = require('./button/button');
var Chat = require('./chat/chat');
var Selector = require('./selector/selector');
var UIManager = function(){
	this.button = new Button();
	this.chat = new Chat();
	this.selector = new Selector();
	this.roomManager;

}

UIManager.prototype.constructor = UIManager;

UIManager.prototype = {

	set : function(roomManager){
		this.roomManager = roomManager;
		this.button.set(roomManager);
		this.chat.set(roomManager);
		this.selector.set(roomManager);
	},
	update : function(){
		this.button.update();
		this.chat.update();
		this.selector.update();
	}
}

module.exports = UIManager;



