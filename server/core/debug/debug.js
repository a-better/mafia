var Debug = function(config){
	this.debugMode = true && config.debug;
	this.useAlert = false || config.alert;
}

Debug.prototype.constructor = Debug;

Debug.prototype.log = function(type, msg){
	if(this.debugMode == false)
		return;
	if(typeof console == "undefined")
		return;

	switch(type){
		case "LOG" :
			console.log(msg);
			break;
		case "WARN" :
			console.warn(msg);
			break;
		case "ERROR" :
			if(this.useAlert){
				alert(msg);
			}
			console.error(msg);
			break;						
	};
}

module.exports = Debug;