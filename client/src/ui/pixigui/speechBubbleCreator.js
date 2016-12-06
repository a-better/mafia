var SpeechBubbleCreator = function(world){
	this.world = world;
	speechBubbleCreator = this;
}

SpeechBubbleCreator.prototype.constructor = SpeechBubbleCreator;
SpeechBubbleCreator.prototype = {
	create : function(x, y, message, scale, timeout){
			  var speechBubble = new PIXI.Container();
              var contents = new PIXI.extras.BitmapText(message, {font: "18px Normal", align: "right"}); 
              var bubble = new PIXI.Container();
              var speechBubbleTextures = [];
              for(var i=0; i < 9; i++){
                var texture = PIXI.Texture.fromFrame('speechBubble '+i+'.ase');
                speechBubbleTextures.push(texture);
              }
              var sprite = new PIXI.Sprite(speechBubbleTextures[0]);
              var tileWidth = sprite.width;
              var tileHeight = sprite.height;
              var xTileNum = Math.ceil((contents.textWidth - (tileWidth - 5) * 2) / tileWidth)+2;
              var yTileNum = Math.ceil((contents.textHeight - (tileHeight - 16) * 2) / tileWidth)+2;
              var xPos = x - xTileNum * tileWidth/2 * scale;
              var yPos = y- (yTileNum+1) * tileHeight * scale;
              for(var i=0; i< yTileNum; i++){
                var spriteSheetColumn = 0
                if(i == 0){
                  spriteSheetColumn =0
                }
                else if(i == (yTileNum -1)){
                  spriteSheetColumn = 2;                   
                }
                else{
                  spriteSheetColumn = 1;
                }
                for(var j=0; j<xTileNum; j++){
                  var sprite;
                  if(j == 0){
                    sprite = new PIXI.Sprite(speechBubbleTextures[3*spriteSheetColumn + 0]);
                  }
                  else if(j == xTileNum -1){
                    sprite = new PIXI.Sprite(speechBubbleTextures[3*spriteSheetColumn + 2]);
                  }
                  else{
                    sprite = new PIXI.Sprite(speechBubbleTextures[3*spriteSheetColumn + 1]);
                  }
                  sprite.setTransform(xPos, yPos, scale, scale);
                  
                  bubble.addChild(sprite);
                  
                  xPos += tileWidth * scale;
                }        
                xPos = x - xTileNum * tileWidth/2 * scale;
                yPos += tileHeight * scale;
              }
              var contentsXPos = x - (xTileNum-1) * tileWidth/2 * scale;
              var contentsYPos = y - (yTileNum) * tileHeight * scale;
              contents.setTransform(contentsXPos, contentsYPos, scale, scale);
              speechBubble.addChild(bubble);
              speechBubble.addChild(contents);
              this.world.addChild(speechBubble);
              setTimeout(function(){speechBubbleCreator.world.removeChild(speechBubble);}, 1000 * timeout);
	}
}

module.exports = SpeechBubbleCreator; 