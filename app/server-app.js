const l = console.log

module.exports = function(app, io, gameRooms, players) {
	io.on('connection', socket => {
		var player = {
			id: socket.id,
			room: undefined,
		}
		var player_ID = socket.id;
		var player_room = undefined;
		//l(socket.id, 'connected');


		socket.on('connection', url => {
			// check invite and connect or create new room
			var invite_ID = url.match(/invite_(.*)/i)
			if(!invite_ID){
				createRoom(player_ID, player_room)
			} else {
				invite_ID = invite_ID[1]
				l('invite_ID : ', invite_ID)
				roomConnect(invite_ID, player_ID, player_room)
			}
		})

		socket.on('checkCell', item =>{
			player_room.checkCell(player_ID, item)
		})
	})
	

	function createRoom(player_ID, player_room){
		var room = new Room(player_ID);
		player_room = room;
		gameRooms.addRoom(room);
	}

	function roomConnect(room_ID, player_ID){
		//check for room_ID in gameRooms.rooms
		//if no => create room
		if(gameRooms.rooms[room_ID]){
			gameRooms.rooms[room_ID].addPlayer(player_ID)
			player_room = gameRooms.rooms[room_ID];
		} else {
			l(' no room, create new')
			//redirect ??
			createRoom(player_ID)
		}
	}

	function closeRoom(room){
		gameRooms.closeRoom(room)
	}

	function openRoom(room){
		gameRooms.openRoom(room)
	}

	function Room(id){
		var that = this;
		var socketX, socketO;

		this.id = id
		this.players = []
		this.turn = undefined
		this.game = [[], [], []]

		
		function waiting(){
			io.to(that.id).emit('waiting', {
				link: 'invite_' + that.id,
			})
		}

		function start(){
			that.turn = that.players[0]
			socketX.emit('start', {turn: true})
			socketO.emit('start', {turn: false})
		}

		function nextTurn(){

		}

		function endGame(){

		}


		


		//external func
		this.addPlayer = function(newPlayer_ID){
			that.players.push(newPlayer_ID)
			var socket = io.sockets.connected[newPlayer_ID];
			socket.join(that.id)

			if(that.players.length == 2){
				socketX = io.sockets.connected[that.players[0]];
				socketO = io.sockets.connected[that.players[1]];

				start()
				closeRoom(that)

			} else if(that.players.length < 2) {
				waiting()
				openRoom(that)
			}
		}
		//mb check in players?
		//add first player
		this.addPlayer(id)

		this.removePlayer = function(player_ID){
			//find and remove
		}

		this.checkCell = function(player_ID, cell){
			l('player turn : ', player_ID == that.turn);
			l(cell)
		}
	}
}
