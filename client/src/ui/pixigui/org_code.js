            var stats = new Stats();
            stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild( stats.dom );
            var scale = 1;
            var low = true;
            if(low){
              scale = 0.5;
            }
            else{
              scale = 1;
            }
            params = {        
              stage: {
                width: window.innerWidth,
                height: window.innerHeight
              },
            
              world: {
                width: 1248  * scale,
                height: 1024 * scale
              },
              
              camera: {
                zoom: 1,
                x:0,
                y:0
              },
              player :
              [
                {
                   x: 1248 * scale * 0.55, 
                   y: 1024 * scale * 0.33
                }                                                    
              ]
              
            }

            var GAME_WIDTH = params.world.width;
            var GAME_HEIGHT = params.world.height;

            var rendererOptions = {
                antialiasing: false,
                transparent : false,
                autoResize: true
            } 

            var world = new pixicam.World({
              screenWidth: params.stage.width,
              screenHeight: params.stage.height,
              width: params.world.width,
              height: params.world.height
            });
          
            var renderer = new PIXI.lights.WebGLDeferredRenderer(params.stage.width, params.stage.height,rendererOptions);
            //var renderer = new PIXI.WebGLRenderer(window.innerWidth, window.innerHeight, rendererOptions);
            var zoom = Math.max(params.stage.width/params.world.width, params.stage.height/params.world.height);
            var stage = new PIXI.Container();
            var camera = world.camera;

                camera.zoom = zoom;
                stage.addChild(world);  
                renderer.view.style.position = "absolute";
                renderer.view.style.top = "0px";
                renderer.view.style.left = "0px";
                //window.addEventListener("resize", resize);

             var block1;
             var movie;
             var text;
            document.body.appendChild(renderer.view);
             var frames = [];
             var normal_frames = [];


            PIXI.loader
                .add('mafia', 'test/low/mafiamap.png')
                .add('mafia_normal', 'test/low/mafiamap_NORMALS.png')
                .add('campfire', 'test/low/campfire.json')
                .add('campfire_normal', 'test/low/campfire_NORMALS.json')
                .add('test/mafiaNormal.fnt')
                .add('test/speechBubble.json')
                .add('test/low/mafiaCharacter.json')
                .add('test/low/mafiaCharacter_NORMALS.json')
                .add('lightmap', 'test/lightmap.png')
                .load(function (loader, res) {
                    var mafiaBackground = new PIXI.Sprite(res.mafia.texture);
                    mafiaBackground.normalTexture = res.mafia_normal.texture;
                    mafiaBackground.setTransform(0, 0);
                    //mafiaBackground.filters = [new LightmapFilter(renderTexture)];
                    world.addChild(mafiaBackground);
                  
                   for(var i=0; i<4; i++){
                        
                        var texture = PIXI.Texture.fromFrame('campfire '+i+'.ase');
                        frames.push(texture);
                        normal_frames.push(PIXI.Texture.fromFrame('campfire_NORMALS '+i+'.ase'));
                   }
                   // console.log(frames);
//
                 movie = new PIXI.Sprite(frames[0]);
                 movie.normalTexture = normal_frames[0];
                 movie.setTransform(0.5*GAME_WIDTH, 0.5 * GAME_HEIGHT);
//
                 movie.anchor.set(0.5, 0.5);

                 world.addChild(movie);

                    world.addChild(new PIXI.lights.AmbientLight(0x110A38, 1));
                    //world.addChild(new PIXI.lights.AmbientLight(0xFFF688, 1));
                    renderer.view.addEventListener("mousedown", mousedown);
                    renderer.view.addEventListener("mouseup", mouseup);
                    renderer.view.addEventListener("mousemove", mousemove);
                    renderer.view.addEventListener("touchstart", touchstart, false);
                    renderer.view.addEventListener("touchmove", touchmove, false);
                    for(var i=0; i<1; i++){
//
                        var clickLight = new PIXI.lights.PointLight(0xff9933, 3);
    //       //
                        clickLight.originalX = movie.position.x;
                        clickLight.originalY = movie.position.y;
                        clickLight.position.x = movie.position.x;
                        clickLight.position.y = movie.position.y;
                        world.addChild(clickLight);
                    }


                    world.update(); 
                   requestAnimationFrame(animate);
                   resize();
                });
            var lastTime = 0;
            function isTimeToAnimate(time, tick){
                if(time - lastTime > tick){
                    lastTime = time;
                    return true;
                }
                else{
                    return false;
                }
            }    
            var i = 0;
            var d = new Date();
            lastTime = d.getTime();

            var light = true;
            function animate() {
              stats.begin();
              d = new Date();
              time = d.getTime();
              if(isTimeToAnimate(time, 1000/33)){
                movie._originalTexture = frames[i%4];
                movie.normalTexture = normal_frames[i%4];

                i++;
              }
              
              if(light){
                renderer.render(stage, true);
                light = false;
              }
              else{
                renderer.render(stage, false); 
              }
              
              world.update(); 
              stats.end();
              requestAnimationFrame(animate);

                
            }
            function resize() {
             
              // Determine which screen dimension is most constrained
              ratio = Math.min(window.innerWidth/GAME_WIDTH,
                               window.innerHeight/GAME_HEIGHT);
             console.log(ratio);
              // Scale the view appropriately to fill that dimension
              //stage.scale.x = stage.scale.y = ratio;
             //mafiaBackground.scale =  GAME_WIDTH /mafiaBackground.width;
              // Update the renderer dimensions
              //renderer.resize(Math.ceil(GAME_WIDTH),
                            // Math.ceil(GAME_HEIGHT));
            }
            var down = false;
            var oldX;
            var oldY;
            function mousedown(e){
                down = true;
                oldX = e.clientX;
                oldY = e.clientY;
              console.log(Math.ceil(e.clientX*100/624)+ '/' + Math.ceil(e.clientY*100/512));
            }
            function mousemove(e){
             if(down == true)
             {
              camera.x -= e.clientX - oldX;
              camera.y -= e.clientY - oldY;             
              camera.x = setCameraBound('x', camera.x, e.clientX - oldX);
              camera.y = setCameraBound('y', camera.y, e.clientY - oldY);                        
              oldX = e.clientX;
              oldY = e.clientY;
             }
            }
            function mouseup(e){
                down = false;
            }
            function touchstart(e){
              document.getElementById("test").blur();
              var touch = e.touches[0];
              oldX = touch.pageX;
              oldY = touch.pageY;
              //console.log(oldX + '/' + oldY);
            }
            function touchmove(e){
              //console.log(oldX + '/' + oldY);
              var touch = e.touches[0];
              camera.x -= touch.pageX - oldX;
              camera.y -= touch.pageY - oldY;
              camera.x = setCameraBound('x', camera.x, touch.pageX - oldX);
              camera.y = setCameraBound('y', camera.y, touch.pageY - oldY);

              oldX = touch.pageX;
              oldY = touch.pageY;
            }
            function setCameraBound(axis, coordinate, moveDirection){
              if(axis == 'x'){
                if(coordinate * camera.zoom < params.stage.width/2 && moveDirection > 0){
                  coordinate = params.stage.width/(2 * camera.zoom);

                }
                else if(coordinate > params.world.width  - params.stage.width/2 &&moveDirection < 0){
                  //coordinate = params.world.width  - params.stage.width/2;
                }
                return coordinate;
              }
              else if(axis == 'y'){
               
                if(coordinate * camera.zoom < params.stage.height/2 && moveDirection > 0){
                  coordinate = params.stage.height/(2 * camera.zoom);

                }
                else if(coordinate > params.world.height  - params.stage.height/2&& moveDirection < 0)
                {
                  //coordinate = (params.world.height  - params.stage.height/2) * camera.zoom+16.5;
                }
                return coordinate;
              }
            }
            function nameTag(x, y, nickname, image, scale){
              //var contents = new PIXI.extras.BitmapText()
              var  name = new PIXI.extras.BitmapText(nickname, {font: "22px Normal", alight: "right"});
              name.setTransform(x+15, y+2.5, scale, scale);

              var table = new PIXI.Graphics();
              var nameTag = new PIXI.Container();
              table.beginFill(0xffffff);
              table.lineStyle(2, 0x000000);
              table.drawRect(x, y, (name.textWidth +35)*scale, (name.textHeight+5) *scale);
              //table.anchor.set(0.5, 0.5);

              var thumbnail;
              if(image == ''){
                thumbnail = new PIXI.Sprite(PIXI.Texture.fromImage('test/no_thumbnail.png'));                
              }
              else{
                thumbnail = new PIXI.Sprite(PIXI.Texture.fromImage(image));
              }
              thumbnail.setTransform(x+10, y+5, scale, scale);
              thumbnail.anchor.set(0.5, 0.5);

              nameTag.addChild(table);
              nameTag.addChild(thumbnail);
              nameTag.addChild(name);          
              return nameTag;

            }
            function speechBubble(x,y,message, scale){

              var contents = new PIXI.extras.BitmapText(message, {font: "18px Normal", align: "right"}); 
              var bubble = new PIXI.Container();
              //var bubble = new PIXI.Graphics();
              //bubble.beginFill(0xffffff);
              //bubble.lineStyle(5, 0x000000); 
              //bubble.drawRect(x, y,bitmapText.textWidth + 20, bitmapText.textHeight+20);
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
              world.addChild(bubble);
              world.addChild(contents);
              setTimeout(function(){world.removeChild(bubble);}, 1000);
              setTimeout(function(){world.removeChild(contents);}, 1000);

            }

            var Player = function(i){
              PIXI.Container.call(this);
              this.id = i;
            }
            Player.prototype.constructor = Player;
            Player.prototype = Object.create(PIXI.Container.prototype);  

            function createPlayer(){    
              alert('11');
              var players = new PIXI.Container();
            
              for(var i=0; i<10; i++){
               var player = new Player(i);
               var playerSprite = new PIXI.Sprite(PIXI.Texture.fromFrame('mafiaCharacter '+i+'.ase')); 
               playerSprite.normalTexture = PIXI.Texture.fromFrame('mafiaCharacter_NORMALS '+i+'.ase');
               playerSprite.anchor.set(0.5, 0.5);
               var x= params.world.width * Math.random();
               var y = params.world.height * Math.random();
               playerSprite.setTransform(x, y);               
               playerName = nameTag(x-playerSprite.width*0.3*scale, y- playerSprite.height*scale, 'player'+ i, 'test/no_thumbnail.png', scale);
               player.addChild(playerSprite);
               player.addChild(playerName);  
               players.addChild(player);
                
              }
              
              var x= params.world.width * Math.random();
              var y = params.world.height * Math.random();              
              speechBubble(x, y, i+'번', scale);

              world.addChild(players);  
              setTimeout(function(){
                var index = world.getChildIndex(players);
                var player = world.getChildAt(index);
                var playerId;
                console.log(player);

                for(var j=0; j<10; j++){ 
                  if(2 == player.children[j].id){
                    playerId = j;
                  }
                }
                console.log(playerId);
                player.removeChildAt(playerId);
                console.log(player);
              }, 1000);
            
              
                                   
            }