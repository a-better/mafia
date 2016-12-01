
//엔트리 애플리케이션 
//최초로 진입하는 애플리케이션 
var express = require('express');
var Engine = require('./src/engine');
var Debug = require('./core/debug/debug');
var app		= express();
var port = '3100';
var ip = '';
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  ip = add;
  console.log(ip);
})

var server = app.listen(port);
var engine = new Engine();
global.debug = new Debug({'debug':true});
engine.network.setConnection(server);

app.locals.pretty = true;
app.set('view engine', 'jade');
app.set('views', './client');
app.use(express.static('client'));

app.post('/:roomId', function(req, res){
	
	user_data = JSON.parse(req.body.user_data);
	url = req.body.url;
	platformServerRoomId = req.body.key;
    roomId = req.params.roomId;
	console.log(user_data.properties);
	//console.log()
	if(!engine.roomManager.searchRoomById(req.params.roomId)){
		var room = engine.roomManager.create(req.params.roomId, platformServerRoomId, url);
		engine.roomManager.add(req.params.roomId, room);
		engine.roomManager.set(req.params.roomId);
	}
	if(engine.roomManager.isPlaying(req.params.roomId)){
		res.send('<script type="text/javascript">alert("게임 중입니다.");</script>');
	}
	else if(engine.roomManager[req.params.roomId].isOverMaximumActor()){
		res.send('<script type="text/javascript">alert("허용인원수를 초과했습니다.");</script>');
	}
	else{
		res.render('room', {roomId : req.params.roomId, 
			nickname : user_data.properties.nickname,
			thumbnail : user_data.properties.thumbnail_image,
			url : url,
			platformRoomId : platformServerRoomId
		});
	}
})



app.get('/:roomId', function(req, res){
	
	//user_data = JSON.parse(req.body.user_data);
	url = 'url';
	platformServerId = 'req.body.key';
    roomId = req.params.roomId;
	//console.log(user_data.properties);
	
	if(!engine.roomManager.haveRoom(req.params.roomId)){
		var room = engine.roomManager.create(req.params.roomId, platformServerId, url);
		engine.roomManager.add(req.params.roomId, room);
		engine.roomManager.set(req.params.roomId);
		
	}
	debug.log("LOG", engine.roomManager.objects[req.params.roomId]);
	if(engine.roomManager.isPlaying(req.params.roomId)){
		res.send('<script type="text/javascript">alert("게임 중입니다.");</script>');
	}
	else if(engine.roomManager.objects[req.params.roomId].isOverMaximumActor()){
		res.send('<script type="text/javascript">alert("허용인원수를 초과했습니다.");</script>');
	}
	else{
		res.render('room', {roomId : req.params.roomId, 
			nickname : 'user_data.properties.nickname',
			thumbnail : 'user_data.properties.thumbnail_image',
			url : url,
			platformServerId : platformServerId
		});
	}
})
//init();
