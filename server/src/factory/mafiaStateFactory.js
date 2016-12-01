var Day = require('../room_state/playing/day');
var Night = require('../room_state/playing/night');
var LastSpeech = require('../room_state/playing/lastSpeech');

var Citizen = require('../actor_state/citizen/citizen');
var Doctor = require('../actor_state/citizen/special/doctor');
var Police = require('../actor_state/citizen/special/police');
var Mafia = require('../actor_state/citizen/special/mafia');
var Spy = require('../actor_state/citizen/special/spy');
var Soldier = require('../actor_state/citizen/special/soldier');

var StateFactory = require('../../core/state/stateFactory');

var Debug = require('../../core/debug/debug');

var MafiaStateFactory = function(data){
	StateFactory.call(this);
	this.mafiaId = data.mafia || 'mafia';
	this.policeId = data.police || 'police';
	this.citizenId = data.citizen || 'citizen';
	this.doctorId = data.doctor || 'doctor';
	this.spyId = data.spy || 'spy';
	this.soldierId = data.soldier || 'soldier';

	this.dayId = data.day || 'day';
	this.nightId = data.night || 'night';
	this.lastSpeechId = data.lastSpeech || 'lastSpeech';

	this.data = {'debug' : false , 'alert' : false};
	this.debug = new Debug({'debug' : false , 'alert' : false});
}

MafiaStateFactory.prototype.constructor = MafiaStateFactory;
MafiaStateFactory.prototype = Object.create(StateFactory.prototype);

MafiaStateFactory.prototype.day = function(){return Day();}
MafiaStateFactory.prototype.night = function(){return Night();}
MafiaStateFactory.prototype.roomState = function(key){
	switch(key){
		case this.dayId:
			return new Day(key);
			break;
		case this.nightId:
			return new Night(key);
			break;
		case this.lastSpeechId:
			return new LastSpeech(key);
			break;	
	}
}
MafiaStateFactory.prototype.actorState = function(key){
	switch(key){
		case this.mafiaId:
			this.debug.log("LOG", key);
			return new Mafia(key);
			break;
		case this.doctorId:	
			this.debug.log("LOG", key);
			return new Doctor(key);
			break;
		case this.policeId:
			this.debug.log("LOG", key);
			return new Police(key);
			break;
		case this.spyId :
			this.debug.log("LOG", key);
			return new Spy(key);
			break;
		case this.soldierId :
			this.debug.log("LOG", key);
			return new Soldier(key);
			break;					
		case this.citizenId:
			this.debug.log("LOG", key);
			return new Citizen(key);
			break;

		default : 
			return new Citizen(key);			
	}
}

module.exports = MafiaStateFactory;