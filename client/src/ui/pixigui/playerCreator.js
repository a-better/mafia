var Player = require('./player');
var SpeechBubbleCreator = require('./speechBubbleCreator');

var PlayerCreator = function(world, document){
	this.players = new PIXI.Container();
	this.world = world;
	this.world.addChild(this.players);
	this.speechBubbleCreator = new SpeechBubbleCreator(this.world);
	this.document = document;
	playerCreator = this;
	this.thumbnails = {};
}

PlayerCreator.prototype.constructor = PlayerCreator;

PlayerCreator.prototype.createPlayerNameTag = function(playerId, x, y, nickname, scale){
    var  name = new PIXI.extras.BitmapText(playerId+ ' ' + nickname, {font: "22px Normal", alight: "right"});
    name.setTransform(x+15, y+2.5, scale, scale);

    var table = new PIXI.Graphics();
    var nameTag = new PIXI.Container();
    table.beginFill(0xffffff);
    table.lineStyle(2, 0x000000);
    table.drawRect(x, y, (name.textWidth +35)*scale, (name.textHeight+5) *scale);

    //var thumbnail;
    //var thumbnailTexture = new PIXI.Texture(new PIXI.BaseTexture(img));
    //thumbnail = new PIXI.Sprite(thumbnailTexture);
    //console.log(thumbnailTexture);
    //thumbnail.setTransform(x+10, y+5, scale, scale);
    //thumbnail.anchor.set(0.5, 0.5);

    nameTag.addChild(table);
    //nameTag.addChild(thumbnail);
    nameTag.addChild(name);          
    return nameTag;
}

PlayerCreator.prototype.createPlayerSprite = function(playerId, x, y){
	var playerSprite = new PIXI.Sprite(PIXI.Texture.fromFrame('mafiaCharacter '+playerId+'.ase'));
	playerSprite.normalTexture = PIXI.Texture.fromFrame('mafiaCharacter_NORMALS '+playerId+'.ase');

	playerSprite.setTransform(x,y);
	playerSprite.anchor.set(0.5, 0.5);
	return playerSprite;
}

PlayerCreator.prototype.createPlayer = function(playerId, x, y, nickname, scale, image){
	var player = new Player(playerId);
	var playerSprite = playerCreator.createPlayerSprite(playerId, x, y);
	player.addChild(playerSprite);
    //var img = new Image();
    //if(typeof image === 'undefined'){
    //	img.src = 'assets/images/no_thumbnail.png';
    //}
    //else{
    //	img.src = image; 
//
    //}
    //img.id = 'thumbnail'+playerId; 
    //img.style.position = 'absolute';
    //img.style.top = y * this.world.camera.zoom;
    //img.style.left = x * this.world.camera.zoom;
    //img.style.width = '50px';
    //img.style.height = '50px';              
    //img.onload = function(){
	//	playerCreator.thumbnails[playerId] = img;	  
	//	document.body.appendChild(img);  
    //}
    //img.style.visibility = 'visible';
    var playerNameTag = playerCreator.createPlayerNameTag(playerId, x, y, nickname, scale);
  	player.addChild(playerNameTag);	
	playerCreator.players.addChild(player);	

	return player;
}

PlayerCreator.prototype.removePlayer = function(playerId){
	var playersIndex = playerCreator.world.getChildIndex(playerCreator.players);
	var players = playerCreator.world.getChildAt(playersIndex);
	for(var i=0; i<players.children.length; i++){
		if(players.children[i].id == playerId){
			return players.removeChildAt(i);
		}
	}
}

PlayerCreator.prototype.existPlayer = function(playerId){
	for(var i=0; i<playerCreator.players.children.length; i++){
		if(playerCreator.players.children[i].id == playerId){
			return true;
		}
	}
	return false;
}

PlayerCreator.prototype.removeAll = function(){
	var playersIndex = playerCreator.world.getChildIndex(playerCreator.players);
	var players = playerCreator.world.getChildAt(playersIndex);
	players.removeChildren(0, players.children.length);
}
PlayerCreator.prototype.createSpeechBubble = function(x, y, message, scale, timeout){
	playerCreator.speechBubbleCreator.create(x, y, message, scale, timeout);
}
PlayerCreator.prototype.moveThumbnails = function(x,y){
	for(key in playerCreator.thumbnails){
		console.log(playerCreator.thumbnails[key].id);
		var thumbnail = playerCreator.document.getElementById(playerCreator.thumbnails[key].id);
		thumbnail.style.top = parseInt(thumbnail.style.top) - y + 'px';
		thumbnail.style.left = parseInt(thumbnail.style.left) - x + 'px';
	}
}
module.exports = PlayerCreator;