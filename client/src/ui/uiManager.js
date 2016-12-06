var Button = require('./button/button');
var Chat = require('./chat/chat');
var Selector = require('./selector/selector');
var World = require('./pixigui/world');
var UIManager = function(){
	this.button = new Button();
	this.chat = new Chat();
	this.selector = new Selector();
	this.world = new World();
	this.roomManager;

}

UIManager.prototype.constructor = UIManager;

UIManager.prototype = {

	set : function(roomManager){
		this.roomManager = roomManager;
		this.button.set(roomManager);
		this.chat.set(roomManager);
		this.selector.set(roomManager);
		this.world.set(roomManager);
	},
	update : function(){
		this.button.update();
		this.chat.update();
		this.selector.update();
		//this.world.update();
	}
}

module.exports = UIManager;



