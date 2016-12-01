Array.prototype.random = function(num, enableDuplicate){
	var array = [];
	var duplicate;
	if(typeof duplicate === "undefined"){
		duplicate = false;
	}
	else{
		duplicate = enableDuplicate;
	}
	if(num <= this.length){
		var index;
		for(var i=0; i<num; i++){
			index = Math.floor(Math.random()*this.length);
			array.push(this[index]); 
			if(!enableDuplicate){
				this.splice(index, 1);
			}	
		}
		return array;
	}	
}
module.exports = Array;