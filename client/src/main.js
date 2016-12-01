var Debug = require('./debug/debug');
var RoomManager = require('./gamelogic/roomManager');
var Network = require('./network/network');
var UIManager = require('./ui/uiManager');

var roomId = $('#roomId').val();
var url = $('#url').val();
var platformServerId = $('#platformServerId').val();
var nickname = $('#nickname').val();
var thumbnail = $('#thumbnail').val();

window.debug = new Debug({'debug': true});

var roomManager = new RoomManager();

var uiManager = new UIManager();

var network = new Network();

network.setConnection();
roomManager.setNetwork(network);

roomManager.setRoom(roomId, url, platformServerId, nickname, thumbnail);


uiManager.set(roomManager); 

network.setObserver('roomManager', roomManager);
roomManager.setObserver('uiManager', uiManager);

roomManager.room.setMyPlayer(nickname, thumbnail);





