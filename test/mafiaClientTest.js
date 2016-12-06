var expect    = require("chai").expect;

//#### Client Side Test ####

//Compile and test(Node.js 테스트) 
//webpack test/mafiaClientTest.js mafia/client/dist/main.bundle.js --target node

//mocha-loader(인 브라우저 테스트) 
//testMafiaClient.bat
//webpack "mocha\!./test/mafiaClientTest.js" mafia/client/dist/main.bundle.js
describe("Simple Client Test", function(){

	it("say hello", function(){

	});
	it("access to dom", function(){

	});

	describe("Set Player State",function(){
		it("set citizen", function(){

		});
		it("set mafia", function(){

		});
		it("set spy", function(){

		});
		it("set soldier", function(){

		});
		it("set police", function(){

		});
		it("set doctor", function(){

		});										
	});


	describe("Set Game State",function(){

		it("IF IDLE, only Host can start game",function(){

		});	
		it("IF Day, player can vote",function(){

		});	

		it("IF Night, player can use skill",function(){

		});	

		it("If game end, state return to idle", function(){

		});

		it("IF player die, player can't vote, and use skill",function(){

		});

		it("IF other player die, player can't vote and use skill to the player",function(){

		});
	});


	describe("chatting system",function(){

		it("if mafia team, player can talk with mafia at night",function(){

		});

		it("if citizen, player can talk with everyone at day",function(){

		});		

		it("if dead, player can only talk with dead",function(){

		});

		it("if notice, player can receive from server",function(){

		});		
							
	});

});