var GameObjectManager = function(){
	this.objects = {};
	this.current = '';

}
GameObjectManager.prototype.constructor = GameObjectManager;

GameObjectManager.prototype = {
	add : function(key, object){
		this.objects[key] = object;
	},
	remove : function(key){
		delete this.objects[key];
	},
	search : function(key){
		return this.objects[key];
	},
	checkObject : function(key){
		if(this.objects[key]){
			return true;
		}
		else{
			return false;
		}
	},
	update : function(key, object){
		if(this.checkObject(key)){
			this.objects[key] = object;
		}	
	},
	length : function(){
		return Object.keys(this.objects).length;
	}
}

module.exports = GameObjectManager;