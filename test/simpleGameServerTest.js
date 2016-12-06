var expect    = require("chai").expect;
var Mafia = require("../mafia/server/src/engine");

describe("Simple Game Server", function() {
	this.timeout(2000);
  	var mafia;
  describe("Join Room", function() {
   	before("create game server", function(){
  		mafia = new Mafia();
  		 for(var i=0; i<100; i++){
    		room = mafia.roomManager.create(i);
    		room.playingTime = 200/1000;
   			mafia.roomManager.add(room.id, room);
    	}		
   		expect(100).to.equal(mafia.roomManager.length());
    	for(var i=0; i<100; i++){
    		mafia.roomManager.set(i);
    		var room = mafia.roomManager.objects[i];
    		expect(true).to.equal(room.stateManager.checkState('idle'));
    		expect(true).to.equal(room.stateManager.checkState('playing'));
    	}	   		
  	});	 	
    it("join Room", function(){
    	for(var i=0; i<100; i++){
 			mafia.roomManager.join(i, 'p1');
    		mafia.roomManager.join(i, 'p2');  
    		expect(2).to.equal(mafia.roomManager.search(i).actorManager.length());		
    	}
    	
    }); 
    it("game start", function(){
    	for(var i=0; i<100; i++){
    		expect('object').to.equal(typeof mafia.roomManager.search(i).game);
    	}
    });

    it("leave Room", function(){
    
    	for(var i=0; i<100; i++){
    		if(i == 50 || i == 10 || i == 60 || i == 70){
     			mafia.roomManager.leave(50, 'p1');
    			mafia.roomManager.leave(50, 'p2');

    			mafia.roomManager.leave(10, 'p1');

    			mafia.roomManager.leave(60, 'p1');

    			mafia.roomManager.leave(70, 'p1');
    			mafia.roomManager.leave(70, 'p2');
    			expect(0).to.equal(mafia.roomManager.search(50).actorManager.length());
    			expect(1).to.equal(mafia.roomManager.search(10).actorManager.length());
    			expect(1).to.equal(mafia.roomManager.search(60).actorManager.length());   			
    			
    		}
    		else{
				expect(2).to.equal(mafia.roomManager.search(i).actorManager.length());
    		}
    	}
    });
    it("game end", function(){
    	for(var i=0; i<100; i++){
    		if(i == 50 || i == 70){
    			expect(i+'').to.equal(i+mafia.roomManager.search(i).game);			
    		}
    		else{
    			expect(i+'object').to.equal(i + typeof mafia.roomManager.search(i).game);
    		}
    	}
    	
    });
    it("join Room2", function(done){
    	var playingTime = mafia.roomManager.objects[0].playingTime;
    	setTimeout(function(){
    		mafia.roomManager.join(50, 'p1');
    		mafia.roomManager.join(50, 'p2');
	
        	for(var i=0; i<100; i++){
    			if(i == 70){
    				expect('').to.equal(mafia.roomManager.objects[i].game);		
    				expect(0).to.equal(mafia.roomManager.objects[70].actorManager.length());
    			}
    			else{
    				expect(i+'object').to.equal(i + typeof mafia.roomManager.search(i).game);
    			}
    		}
    		done();
    	}
    	, 1000 * playingTime/2);
    	

    }); 
    it("game timeout", function(done){
    	var playingTime = mafia.roomManager.objects[0].playingTime;
    	setTimeout(function(){
    		for(var i=0; i<100; i++){
    			if(i != 70 && i != 50){
    				expect(i + '').to.equal(i + mafia.roomManager.objects[i].game);
    			}    			
    		}
    		done();		  		
    	}, 1000 * playingTime/2);
    });  
    it("game timeout2", function(done){
    	var playingTime = mafia.roomManager.objects[70].playingTime;
    	setTimeout(function(){
    		expect('').to.equal( mafia.roomManager.objects[70].game);
    		done();
    	}, 1000 * playingTime/2);
    });
  });

  describe("room state transition", function(){ 	
   	before("create game server", function(){
  		mafia = new Mafia();
  		 for(var i=0; i<100; i++){
    		room = mafia.roomManager.create(i);
    		room.playingTime = 200/1000;
   			mafia.roomManager.add(room.id, room);
    	}		
   		expect(100).to.equal(mafia.roomManager.length());
    	for(var i=0; i<100; i++){
    		mafia.roomManager.set(i);
    		var room = mafia.roomManager.objects[i];
    		expect(true).to.equal(room.stateManager.checkState('idle'));
    		expect(true).to.equal(room.stateManager.checkState('playing'));
    	}	   		
  	});	 	
  	it("join first group's room", function(){
  		for(var i=0; i<50; i++){
  			mafia.roomManager.join(i, 'p1');
  			mafia.roomManager.join(i, 'p2');
  			expect(2).to.equal(mafia.roomManager.search(i).actorManager.length());
  		} 	
  	});
  	it("join second group's room", function(done){
  		var playingTime = mafia.roomManager.search(0).playingTime;
  		setTimeout(function(){
  			for(var i=50; i<100; i++){
  				mafia.roomManager.join(i, 'p0');
  				mafia.roomManager.join(i, 'p1');
  				expect(2).to.equal(mafia.roomManager.search(i).actorManager.length());
  			}
  			done();
  		}, 1000 *playingTime/2);
  	});
  	it("check first join timeout", function(done){
  		var playingTime = mafia.roomManager.search(0).playingTime;
  		setTimeout(function(){
   			for(var i=0; i<50; i++){
  				var state = mafia.roomManager.search(i).stateManager.current;
  				expect('idle').to.equal(state);
  			}
  			for(var i=50; i<100; i++){
  				var state = mafia.roomManager.search(i).stateManager.current;
  				expect('playing').to.equal(state);
  			} 
  			done();			
  		}, 1000 * playingTime/2);
  	});
  	it("check second join timeout", function(done){
  		var playingTime = mafia.roomManager.search(0).playingTime;
  		setTimeout(function(){
  			for(var i=0; i<100; i++){
  				var state = mafia.roomManager.search(i).stateManager.current;
  				expect('idle').to.equal(state);
  			}
  			done();
  		}, 1000 * playingTime/2)

  	});
  	it("start first group's game", function(){
  		for(var i=0; i<50; i++){
  			mafia.roomManager.search(i).start(mafia.roomManager.search(i));
  			var state = mafia.roomManager.search(i).stateManager.current;
  			expect('playing').to.equal(state);
  		}
  	});
  	it("start second group's game", function(done){
  		var playingTime = mafia.roomManager.search(0).playingTime;
  		setTimeout(function(){
  			for(var i=50; i<100; i++){
  				mafia.roomManager.search(i).start(mafia.roomManager.search(i));
  				var state = mafia.roomManager.search(i).stateManager.current;
  				expect('playing').to.equal(state);
  			}
  			done();
  		}, 1000 * playingTime/2);

  	});
  	it("end first group's game", function(done){
  		var playingTime = mafia.roomManager.search(0).playingTime;
  		setTimeout(function(){
  			var state;
  			for(var i=0; i<25; i++){
  				var room = mafia.roomManager.search(i);
  				room.end();
  				expect('idle').to.equal(room.stateManager.current);
  			}
  			done();
  		}, 1000*playingTime/4)
  	});
  	it("check first group's timeout",function(done){
  		var playingTime = mafia.roomManager.search(0).playingTime;
  		setTimeout(function(){
  			for(var i=25; i<50; i++){
  				var room = mafia.roomManager.search(i);
  				expect('idle').to.equal(room.stateManager.current);
  			}	
  			done();
  		},  1000*playingTime/4);
  	});
  	it("start game again..", function(done){
  		var playingTime = mafia.roomManager.search(0).playingTime;
  		setTimeout(function(){
  			for(var i=0; i<100; i++){
  				var room = mafia.roomManager.search(i);
  				room.start(room);
  				expect('playing').to.equal(room.stateManager.current); 					
  			}
  			done();
  		}, 1000 * playingTime/4);
  	});
  	it("check timeout again..", function(done){
  		var playingTime = mafia.roomManager.search(0).playingTime;
  		setTimeout(function(){
  			for(var i=0; i<100; i++){
  				var room = mafia.roomManager.search(i);
  				expect('idle').to.equal(room.stateManager.current);
  			}
  			done();
  		}, 1000* playingTime);
  	});
  });

});