var expect    = require("chai").expect;
var Mafia = require("../mafia/server/src/engine");
var MafiaActorManager = require("../mafia/server/src/actor/mafiaActorManager");
var MafiaRoom = require("../mafia/server/src/room/mafiaRoom");
var MafiaRoomManager = require("../mafia/server/src/room/mafiaRoomManager");
var MafiaStateFactory = require('../mafia/server/src/factory/mafiaStateFactory');
var Array = require("../mafia/server/core/utils/array");
var Debug = require("../mafia/server/core/debug/debug");
describe("Mafia Game Server", function() {
	this.timeout(2000);
  	var mafia;
    var debug = new Debug({'debug': true});
  describe("mafia game's state", function(){
    var mafiaRoom;
    var stateFactory;
    before("generate game state", function(){
      stateFactory = new MafiaStateFactory({'day':'day','night':'night'});
      mafiaRoom = new MafiaRoom(0, 8, 10);
      mafiaRoom.setState(stateFactory);
      debug.log("LOG", mafiaRoom.stateManager);
    });
    it("change to playing from idle", function(done){
      mafiaRoom.start(mafiaRoom);
      setTimeout(function(){debug.log("LOG", mafiaRoom.stateManager.current), done();},1000);
    });

  });
  describe("player state", function(){
    var mafiaActorManager
    before("generate player state", function(){
      mafiaActorManager = new MafiaActorManager();
      for(var i=0; i<8; i++){
        mafiaActorManager.add('p' +i, 'test', 'test');
      }
      mafiaActorManager.setActorState(8);

    });
    it("if citizen, player can vote", function(){
      var liveActors = mafiaActorManager.getLiveActors();
      var votedPlayer = liveActors.random(liveActors.length, true);
      for(var i =0; i<votedPlayer.length; i++){
        mafiaActorManager.vote(liveActors[i].id, votedPlayer[i].id);

      }
      var mostVoted = mafiaActorManager.selectMostVotedActor();
      if(typeof mostVoted === "undefined"){
        debug.log("LOG",'투표가 무효로 처리 되었습니다.');
      }else{
        mafiaActorManager.killVotedCitizen(mostVoted);
        debug.log("LOG", mostVoted  + "가 투표로 죽었습니다.");
      }
    });
    it("if mafia, player can kill", function(){
      mafiaActorManager.reset();
      var mafias = mafiaActorManager.getActorByState('mafia');
      var soldier = mafiaActorManager.getActorByState('soldier');
      var liveActors = mafiaActorManager.getLiveActors();
      var votedPlayer = liveActors.random(1, true);
      mafiaActorManager.setSkillTarget(mafias[0].id,votedPlayer[0].id);
      debug.log("LOG", "마피아"+mafias[0].id+"가 " +votedPlayer[0].id+"을 타겟으로 잡았습니다.");
      votedPlayer = liveActors.random(1, true);
      mafiaActorManager.setSkillTarget(mafias[1].id,votedPlayer[0].id);
      debug.log("LOG", "마피아"+mafias[1].id+"가 " +votedPlayer[0].id+"을 타겟으로 잡았습니다.");
      debug.log("LOG", mafiaActorManager.killedCitizen);
      var kill = mafiaActorManager.killCitizen();
      if(kill){
        debug.log("LOG",'플레이어 '+mafiaActorManager.killedCitizen+'이 마피아에 의해 죽었습니다.');
      }
    });
    it("if doctor, player can save", function(){
      mafiaActorManager.reset();
      var doctor = mafiaActorManager.getActorByState('doctor');
      var mafias = mafiaActorManager.getActorByState('mafia');
      var liveActors = mafiaActorManager.getLiveActors();
      var targetPlayer = liveActors.random(2, true);
      if(doctor.length == 0){
        debug.log("LOG", "의사 사망");
      }
      else if(mafias.length == 0){
        debug.log("LOG", "마피아 사망");
      }
      else{
        mafiaActorManager.setSkillTarget(doctor[0].id, targetPlayer[1].id);
        debug.log("LOG", "의사"+doctor[0].id+"가 " +targetPlayer[1].id+"을 타겟으로 잡았습니다.");
        mafiaActorManager.setSkillTarget(mafias[0].id, targetPlayer[0].id);
        debug.log("LOG", "마피아"+mafias[0].id+"가 " +targetPlayer[0].id+"을 타겟으로 잡았습니다.");
        var result = mafiaActorManager.killCitizen();
        if(result){
          debug.log("LOG",'플레이어 '+mafiaActorManager.killedCitizen+'이 마피아에 의해 죽었습니다.');
        }
        else{
          debug.log("LOG",'플레이어 '+mafiaActorManager.killedCitizen+'가 의사에 의해 구해졌습니다.');
  
        }
      }
    });
    it("if police, player can search mafia", function(){
      mafiaActorManager.reset();
      var police = mafiaActorManager.getActorByState('police');
      var liveActors = mafiaActorManager.getLiveActors();
      var targetPlayer = liveActors.random(1, true);
      if(police.length > 0){
        mafiaActorManager.setSkillTarget(police[0].id, targetPlayer[0].id);
        debug.log("LOG", "경찰"+police[0].id+"가 " +targetPlayer[0].id+"을 타겟으로 잡았습니다.");
        var result = mafiaActorManager.detectCitizen(police[0].id);
        if(result){
          debug.log("LOG", targetPlayer[0].id + "는 "+result+ "입니다." );
        }else{
          debug.log("LOG", targetPlayer[0].id + "는 마피아가 아닙니다.");
        }
      }
      else{
        debug.log("LOG", "경찰 사망");
      }
    });
    it("if spy, player can search mafia", function(){
      mafiaActorManager.reset();
      var spy = mafiaActorManager.getActorByState('spy');
      var liveActors = mafiaActorManager.getLiveActors();
      var targetPlayer = liveActors.random(1, true);
      if(spy.length == 0){
        debug.log("LOG", "스파이 사망");
      }
      else{
        mafiaActorManager.setSkillTarget(spy[0].id, targetPlayer[0].id);
        debug.log("LOG", "스파이"+spy[0].id+"가 " +targetPlayer[0].id+"을 타겟으로 잡았습니다.");
        var result = mafiaActorManager.detectCitizen(spy[0].id);
        if(result){
          debug.log("LOG", targetPlayer[0].id + "는 "+result+ "입니다. 당신은 마피아팀이 되었습니다." );
        }else{
          debug.log("LOG", targetPlayer[0].id + "는 마피아가 아닙니다.");
        }
      }

    }); 
    it("if spy search mafia, player can search all player's jobs", function(){
      mafiaActorManager.reset();
      var spy = mafiaActorManager.getActorByState('spy');
      var liveActors = mafiaActorManager.getLiveActors();
      var targetPlayer = liveActors.random(1, true);
      if(spy.length == 0){
        debug.log("LOG", "스파이 사망");
      }
      else{
        spy[0].state.isMafia = true;
        mafiaActorManager.setSkillTarget(spy[0].id, targetPlayer[0].id);
        debug.log("LOG", "스파이"+spy[0].id+"가 " +targetPlayer[0].id+"을 타겟으로 잡았습니다.");
        var result = mafiaActorManager.detectCitizen(spy[0].id);
        if(result){
          debug.log("LOG", targetPlayer[0].id + "는 "+result+ "입니다.");
        }
      }
    });    
    it("if soldier, player can avoid kill", function(){
      mafiaActorManager.reset();
      var mafias = mafiaActorManager.getActorByState('mafia');
      var soldier = mafiaActorManager.getActorByState('soldier');

      if(mafias.length == 0){
        debug.log("LOG", "마피아 사망");
      }
      else if(soldier == 0){
        debug.log("LOG", "군인 사망");
      }
      else{
        mafiaActorManager.setSkillTarget(mafias[0].id, soldier[0].id);
        var result = mafiaActorManager.killCitizen();
        if(result){
           debug.log("LOG",'플레이어 '+mafiaActorManager.killedCitizen+'이 마피아에 의해 죽었습니다.');
        }
        else if(soldier[0].state.avoidKill){
          debug.log("LOG",'군인 '+soldier[0].id+'이 마피아의 총격을 피했습니다.');
        }
     }
    }); 
    it("if soldier, when spy search soldier, player can know who is spy", function(){
    });      
  
  });

  describe("connect current game state and player state", function(){
    var mafiaRoom;
    var mafiaRoomManager;
    var stateFactory;
    before("generate game state", function(){
      mafiaRoomManager = new MafiaRoomManager();
      stateFactory = new MafiaStateFactory({'day':'day','night':'night'});
      mafiaRoom = new MafiaRoom(0, 8, 10);
      mafiaRoom.setState(stateFactory);
      mafiaRoomManager.add(0, mafiaRoom);
      mafiaRoom = new MafiaRoom(1, 8, 10);
      mafiaRoom.setState(stateFactory);
      mafiaRoomManager.add(1, mafiaRoom);

      for(var i=0; i<8; i++){
       mafiaRoomManager.join(0, 'p'+i, '1', '2');
      }
      mafiaRoomManager.objects[0].setActorState();
      mafiaRoomManager.startGame(0);
      

      
      debug.log("LOG",  mafiaRoomManager.objects[0].stateManager);
      
    });
    it("when first night, doctor can save himself", function(){
      var doctor = mafiaRoomManager.objects[0].actorManager.getActorByState('doctor');
      mafiaRoomManager.objects[0].useSkill(doctor[0].id, doctor[0].id);

    });
    it("when night, special skill is usable", function(){
      var spy = mafiaRoomManager.objects[0].actorManager.getActorByState('spy');
       var mafia = mafiaRoomManager.objects[0].actorManager.getActorByState('mafia');
       var soldier = mafiaRoomManager.objects[0].actorManager.getActorByState('soldier');
        var police = mafiaRoomManager.objects[0].actorManager.getActorByState('police');
      mafiaRoomManager.objects[0].useSkill(police[0].id, mafia[0].id);
    });
    it("when day, vote and select Most Voted Actor",function(done){
      setTimeout(function(){
        var liveActors = mafiaRoomManager.objects[0].actorManager.getLiveActors();
        var votedPlayer = liveActors.random(liveActors.length, true);
        for(var i =0; i<votedPlayer.length; i++){
          mafiaRoomManager.objects[0].actorManager.vote(liveActors[i].id, votedPlayer[i].id);
        }
        for(var i =0; i<votedPlayer.length; i++){
         debug.log("LOG", mafiaRoomManager.objects[0].actorManager.objects[liveActors[i].id].state.vote);
        }
        done();
      },51);
    });
    it("check vote result",function(done){
            setTimeout(function(){
              done();
      }, 50);
    });
  });

  describe("mafia game cycle", function(){
    var mafiaRoom;
    var mafiaRoomManager;
    var stateFactory;
    before("generate game state", function(){
      mafiaRoomManager = new MafiaRoomManager();
      mafiaRoomManager.add(0, mafiaRoomManager.create(0, 8, 10, 'key', 'url'));
      mafiaRoomManager.set(0);
      for(var i=0; i<8; i++){
       mafiaRoomManager.join(0, 'p'+i, '1', '2');
      }
      mafiaRoomManager.objects[0].setActorState();
      mafiaRoomManager.startGame(0);
         
      debug.log("LOG",  mafiaRoomManager.objects[0].stateManager);
      
    });    
    it("if citizen's number equal to mafia's, mafia win", function(){
        var liveActors = mafiaRoomManager.objects[0].actorManager.getLiveActors();
        var votedPlayer = liveActors.random(6, true);
         var mafia = mafiaRoomManager.objects[0].actorManager.getActorByState('mafia');
        debug.log("LOG", mafia.length);
        for(var i=0; i<liveActors.length; i++){
          if(liveActors[i].id != mafia[0].id && liveActors[i].id != mafia[1].id){
            mafiaRoomManager.objects[0].actorManager.killVotedCitizen(liveActors[i].id);
          }
          
        }
        debug.log("LOG", mafiaRoomManager.objects[0].actorManager.getLiveActors().length);
    });
    it("if mafia all dead, citizen win", function(done){
      setTimeout(function(){
          mafiaRoomManager.objects[0].reset();
          mafiaRoomManager.objects[0].setActorState();
          mafiaRoomManager.startGame(0);
         var liveActors = mafiaRoomManager.objects[0].actorManager.getLiveActors();
         var votedPlayer = liveActors.random(6, true);
          var mafia = mafiaRoomManager.objects[0].actorManager.getActorByState('mafia');
         debug.log("LOG", mafia.length);
         for(var i=0; i<mafia.length; i++){
            mafiaRoomManager.objects[0].actorManager.killVotedCitizen(mafia[i].id);
         }
         debug.log("LOG", mafiaRoomManager.objects[0].actorManager.getLiveActors().length);
          
        done();
      }, 60);

    });
    it("if game end, game is enable to start again", function(done){
      setTimeout(function(){
        done();
      },51);

    })
  });
});