var PlayerCreator = require('./playerCreator');

var World = function(){
		thisWorld = this;
		this.roomManager = new Object();
 		this.stats = new Stats();
 		this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
 		document.body.appendChild(this.stats.dom );
 		this.scale = 1;
 		this.low = true;
 		if(this.low){
 		  this.scale = 0.5;
 		}
 		else{
 		  this.scale = 1;
 		}
 		this.params = {        
 		  stage: {
 		    width: window.innerWidth,
 		    height: window.innerHeight
 		  },
 		
 		  world: {
 		    width: 1248  * this.scale,
 		    height: 1024 * this.scale
 		  },	  
 		  camera: {
 		    zoom: 1,
 		    x:0,
 		    y:0
 		  }	  
 		}

        rendererOptions = {
            antialiasing: false,
            transparent : false,
            autoResize: true
        } 

        this.world = new pixicam.World({
          screenWidth: this.params.stage.width,
          screenHeight: this.params.stage.height,
          width: this.params.world.width,
          height: this.params.world.height
        });
        
        this.renderer = new PIXI.lights.WebGLDeferredRenderer(this.params.stage.width, this.params.stage.height,rendererOptions);
        //var renderer = new PIXI.WebGLRenderer(window.innerWidth, window.innerHeight, rendererOptions);
        zoom = Math.max(this.params.stage.width/this.params.world.width, this.params.stage.height/this.params.world.height);
        this.stage = new PIXI.Container();
        this.camera = this.world.camera;
        this.camera.zoom = zoom;
        this.stage.addChild(this.world);  
        this.renderer.view.style.position = "absolute";
        this.renderer.view.style.top = "0px";
        this.renderer.view.style.left = "0px";
        this.movie;
        document.body.appendChild(this.renderer.view);
        this.frames = [];
        this.normal_frames = [];
        this.playerCreator = new Object();
        PIXI.loader
            .add('mafia', 'assets/images/low/mafiamap.png')
            .add('mafia_normal', 'assets/images/low/mafiamap_NORMALS.png')
            .add('campfire', 'assets/images/low/campfire.json')
            .add('campfire_normal', 'assets/images/low/campfire_NORMALS.json')
            .add('assets/images/mafiaNormal.fnt')
            .add('assets/images/speechBubble.json')
            .add('assets/images/low/mafiaCharacter.json')
            .add('assets/images/low/mafiaCharacter_NORMALS.json')
            .load(function (loader, res) {
                var mafiaBackground = new PIXI.Sprite(res.mafia.texture);
                mafiaBackground.normalTexture = res.mafia_normal.texture;
                mafiaBackground.setTransform(0, 0);
                thisWorld.world.addChild(mafiaBackground);             
                for(var i=0; i<4; i++){
                    thisWorld.frames.push(PIXI.Texture.fromFrame('campfire '+i+'.ase'));
                    thisWorld.normal_frames.push(PIXI.Texture.fromFrame('campfire_NORMALS '+i+'.ase'));
                }

             	thisWorld.movie = new PIXI.Sprite(thisWorld.frames[0]);
             	thisWorld.movie.normalTexture = thisWorld.normal_frames[0];
             	thisWorld.movie.setTransform(0.5*thisWorld.params.world.width, 0.5 * thisWorld.params.world.height);
             	thisWorld.movie.anchor.set(0.5, 0.5);

             	thisWorld.world.addChild(thisWorld.movie);

                thisWorld.world.addChild(new PIXI.lights.AmbientLight(0x110A38, 1));

                thisWorld.renderer.view.addEventListener("mousedown", thisWorld.mousedown);
                thisWorld.renderer.view.addEventListener("mouseup", thisWorld.mouseup);
                thisWorld.renderer.view.addEventListener("mousemove", thisWorld.mousemove);
                thisWorld.renderer.view.addEventListener("touchstart", thisWorld.touchstart, false);
                thisWorld.renderer.view.addEventListener("touchmove", thisWorld.touchmove, false);
                fireLight = new PIXI.lights.PointLight(0xff9933, 3);
                fireLight.originalX = thisWorld.movie.position.x;
                fireLight.originalY = thisWorld.movie.position.y;
                fireLight.position.x = thisWorld.movie.position.x;
                fireLight.position.y = thisWorld.movie.position.y;
                thisWorld.playerCreator = new PlayerCreator(thisWorld.world, document); 
                thisWorld.world.addChild(fireLight);
                thisWorld.world.update();
                requestAnimationFrame(thisWorld.animate);      
        });
        this.down = false;
        this.oldX;
        this.oldY;  
        this.lastTime = 0;
        this.i = 0;
        this.d = new Date();
        this.lastTime = this.d.getTime();
        this.light = true;         
}

World.prototype.constructor = World;
World.prototype = {

	set : function(roomManager){
		this.roomManager = roomManager;
	},
    isTimeToAnimate : function(time, tick){
        if(time - this.lastTime > tick){
            this.lastTime = time;
            return true;
        }
        else{
            return false;
        }
    },   
    animate :function() {
      thisWorld.stats.begin();
      d = new Date();
      time = d.getTime();
      if(thisWorld.isTimeToAnimate(time, 1000/33)){
        thisWorld.movie._originalTexture = thisWorld.frames[thisWorld.i%4];
        thisWorld.movie.normalTexture = thisWorld.normal_frames[thisWorld.i%4];
        thisWorld.i++;
        if(thisWorld.i%4 == 0){
        	thisWorld.i = 0;
        }
      }     
      thisWorld.renderer.render(thisWorld.stage, true);
      thisWorld.update();
      thisWorld.world.update();
      thisWorld.stats.end();
      requestAnimationFrame(thisWorld.animate);    
    },
    mousedown : function(e){
        thisWorld.down = true;
        thisWorld.oldX = e.clientX;
        thisWorld.oldY = e.clientY;
      console.log(Math.ceil(e.clientX*100/624)+ '/' + Math.ceil(e.clientY*100/512));
    },
    mousemove : function(e){
     if(thisWorld.down == true)
     {
      var cameraOldX = thisWorld.camera.x;
      var cameraOldY = thisWorld.camera.y;
      thisWorld.camera.x -= e.clientX - thisWorld.oldX;
      thisWorld.camera.y -= e.clientY - thisWorld.oldY; 
      thisWorld.camera.x = thisWorld.setCameraBound('x', thisWorld.camera.x, e.clientX - thisWorld.oldX);
      thisWorld.camera.y = thisWorld.setCameraBound('y', thisWorld.camera.y, e.clientY - thisWorld.oldY);                        
      thisWorld.oldX = e.clientX;
      thisWorld.oldY = e.clientY;
     }
    },
    mouseup : function(e){
        thisWorld.down = false;
    },
    touchstart : function(e){
      document.getElementById("messageBox").blur();
      var touch = e.touches[0];
      thisWorld.oldX = touch.pageX;
      thisWorld.oldY = touch.pageY;
      //console.log(oldX + '/' + oldY);
    },
    touchmove : function (e){
      //console.log(oldX + '/' + oldY);
      var touch = e.touches[0];
      thisWorld.camera.x -= touch.pageX - thisWorld.oldX;
      thisWorld.camera.y -= touch.pageY - thisWorld.oldY;
      thisWorld.camera.x = thisWorld.setCameraBound('x', thisWorld.camera.x, touch.pageX - thisWorld.oldX);
      thisWorld.camera.y = thisWorld.setCameraBound('y', thisWorld.camera.y, touch.pageY - thisWorld.oldY);

      thisWorld.oldX = touch.pageX;
      thisWorld.oldY = touch.pageY;
    },
    setCameraBound : function(axis, coordinate, moveDirection){
      if(axis == 'x'){
        if(coordinate * thisWorld.camera.zoom < thisWorld.params.stage.width/2 && moveDirection > 0){
          //coordinate = thisWorld.params.stage.width/(2 * thisWorld.camera.zoom);

        }
        else if(coordinate > thisWorld.params.world.width  - thisWorld.params.stage.width/2 &&moveDirection < 0){
       	   //coordinate = (thisWorld.params.world.width  - thisWorld.params.stage.width/2) * thisWorld.camera.zoom+16.5;
        }
        return coordinate;
      }
      else if(axis == 'y'){
       
        if(coordinate * thisWorld.camera.zoom < thisWorld.params.stage.height/2 && moveDirection > 0){
          //coordinate = thisWorld.params.stage.height/(2 * thisWorld.camera.zoom);

        }
        else if(coordinate > thisWorld.params.world.height  - thisWorld.params.stage.height/2&& moveDirection < 0)
        {
          //coordinate = (thisWorld.params.world.height  - thisWorld.params.stage.height/2) * thisWorld.camera.zoom+16.5;
        }
        return coordinate;
      }
    },
    update : function(){
    	if(thisWorld.playerCreator.players.children.length != thisWorld.roomManager.room.getPlayerNumber()){
    		thisWorld.updatePlayer();
    	}
    	thisWorld.updateSpeechBubble();
    },
    updatePlayer : function(){
    	thisWorld.playerCreator.removeAll();
    	console.log('before');
    	console.log(thisWorld.playerCreator.players);
    	var seats = thisWorld.roomManager.room.seatManager.objects;
    	for(key in seats){
    		if(seats[key].state == 'use'){
    			var id = seats[key].id;
    			var x = seats[key].x;
    			var y = seats[key].y;
    			var scale = 0.5;
    			var nickname = seats[key].player.nickname;
    			var thumbnail = seats[key].player.thumbnail;
    			thisWorld.playerCreator.createPlayer(id,x,y,nickname,scale,thumbnail);    		
    		}
    	}
    	console.log('after');
    	console.log(thisWorld.playerCreator.players);
    },
    updateSpeechBubble : function(){
    	var seats = thisWorld.roomManager.room.seatManager.objects;
    	for(key in seats){
    		if(seats[key].state == 'use'){
    			if(seats[key].player.isTalk){
    				var x = seats[key].x;
    				var y = seats[key].y;
    				console.log(x+'/'+y);
    				var message = seats[key].player.talk;
    				var scale = 0.5;
    				var timeout = 1.5;
    				thisWorld.playerCreator.createSpeechBubble(x,y,message,scale,timeout);
    				seats[key].player.isTalk = false;
    			}
    		}
    	}
    }	
}

module.exports = World;