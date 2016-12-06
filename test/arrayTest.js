var Array = require('../mafia/server/core/utils/array');
var expect    = require("chai").expect;
describe("Array Util Test", function(){

	describe("Array Select Random Element", function(){
		it("select random element", function(){
			for(var i=0; i<100; i++){
				var num = 2;
				var array = [1,2,3,4,5,6];
				var selectedElement = array.random(num);
				expect(selectedElement[1]).is.not.equal(selectedElement[0]);
			}
		});
	});
});