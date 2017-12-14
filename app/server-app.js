const l = console.log

module.exports = function(app, io, gameRooms, players) {
	io.on('connection', socket => {
		var player = {
			id: socket.id,
			room: undefined,
		}

		socket.on('connection', url => {
			// check invite and connect or create new room
			var invite_ID = url.match(/invite_(.*)/i)
			if(!invite_ID){
				createRoom(player)
			} else {
				invite_ID = invite_ID[1]
				roomConnect(invite_ID, player)
			}
		})

		socket.on('disconnect', props => {
			if(player.room)	player.room.removePlayer(player.id)
		})

		socket.on('checkCell', item =>{
			player.room.checkCell(player, item)
		})

		socket.on('restartGame', props => {
			player.room.restartGame(socket)
		})

		socket.on('chatTyping', props => {
			var sign = props.sign
			player.room.showTyping(sign, socket)
		})

		socket.on('chatMessage', props => {
			var msg = props.msg
			var from = props.from

			player.room.sendMessage(msg, from)

		})

	})
	

	function createRoom(player){
		var room = new Room(player.id);
		player.room = room;
		gameRooms.addRoom(room);
	}

	function roomConnect(room_ID, player){
		//check for room_ID in gameRooms.rooms
		//if no => create room
		if(gameRooms.rooms[room_ID]){
			gameRooms.rooms[room_ID].addPlayer(player.id)
			player.room = gameRooms.rooms[room_ID];
		} else {
			l(' no room, create new')
			createRoom(player)
		}
	}

	function Room(id){
		var that = this;
		var socketX, socketO, whatchmen;

		// is it important to make props accessible from the outside???
		this.id = id
		var players = []
		var turn = undefined
		var sign = undefined // 0 for X; 1 for 0...change?
		this.state = null
		this.statistic = {
			'X' : 0,
			'0' : 0,
			'draw' : 0,
		}
		this.game = [new Array(3), new Array(3), new Array(3)]

		//add first player
		addPlayer(id)

		// room
		function addPlayer(newPlayer_ID){
			players.push(newPlayer_ID)
			var socket = io.sockets.connected[newPlayer_ID];
			socket.join(that.id)

			checkCountOfPlayers()
		}

		function removePlayer(player_ID){
			var index = players.indexOf(player_ID);
			if(index == -1) return
			players.splice(index,1)

			clearGame()
			
			checkCountOfPlayers()
		}

		function checkCountOfPlayers(){
			if(players.length >= 2){
				socketX = io.sockets.connected[players[0]];
				socketO = io.sockets.connected[players[1]];
				if(players.length > 2) whatchmen = players.slice(2);

				if(that.state != 'started'){
					start()
				} else {
					 // give watchmen emit 'watch'
				}

			} else if(players.length == 0){
				l('remove room')
				gameRooms.removeRoom(that.id)

			} else if(players.length < 2) {
				waiting()
			}
		}
		
		function checkCell(player, cell){
			if(players[turn] != player.id){
				l('not this player turn!')
				return
			}

			if(that.game[cell.row][cell.cell] === undefined){
				that.game[cell.row][cell.cell] = turn

				io.to(that.id).emit('place', {
					cell: cell,
					sign: sign,
				})

				//if no one win -> nextTurn
				if(!checkEndGame()){
					nextTurn()
				}

			} else {
				io.sockets.connected[player.id].emit('enable', true)
			}
		}

		function checkEndGame(){
			//try to find row with same elements
			var game = that.game
			
			var elem1, elemCurrent, isSame
			var emptyCells = false

			// 1 // check horisontal rows for same sign in one
				 // and check for empty cells
			for(var i = 0; i < 3; i++){
				elem1 = game[i][0]
				
				if(elem1 == undefined){
					emptyCells = true
					continue
				}

				isSame = true

				for(var k = 1; k < 3; k++){
					elemCurrent = game[i][k]
					if(elemCurrent == undefined) emptyCells = true
					if(elemCurrent != elem1) isSame = false
				}

				if(isSame){
					endGame('win', [
						[i,0], [i,1], [i,2]
					])
					return true
				}
			} 

			// 2 // check vertical columns for same sign in one
			for(var i = 0; i < 3; i++){
				elem1 = game[0][i]
				if(elem1 == undefined) continue
				isSame = true

				for(var k = 1; k < 3; k++){
					elemCurrent = game[k][i]
					if(elemCurrent != elem1) isSame = false
				}

				if(isSame){
					endGame('win', [
						[0,i], [1,i], [2,i]
					])
					return true
				}
			} 

			// 3 d-1 // check first diagonal left-top to right-bottom
			elem1 = game[0][0];
			if(elem1 != undefined){
				isSame = true

				for(var i = 1; i < 3; i++){
					elemCurrent = game[i][i]
					if(elemCurrent != elem1) isSame = false
				}
				
				if(isSame){
					endGame('win', [
						[0,0], [1,1], [2,2]
					])
					return true
				}
			}

			// 4 d-2 // check second diagonal left-bottom to right-top
			elem1 = game[0][2];
			if(elem1 != undefined){
				isSame = true
				for(var i = 1; i < 3; i++){
					elemCurrent = game[i][2-i]
					if(elemCurrent != elem1) isSame = false
				}
				
				if(isSame){
					endGame('win', [
						[0,2], [1,1], [2,0]
					])
					return true
				}
			}

			if(!emptyCells){
				endGame('draw')
				return true
			}

			return false;

		}

		function endGame(state, winArr){
			that.state = 'ended'

			switch(state){
				case 'win'	: 
							that.statistic[sign]++
							l('WINNER : ', sign)
							break;
				case 'draw'	: 
							that.statistic.draw++
							l('DRAW')
							break;
			}

			io.to(that.id).emit('endGame', {
				state: state,
				statistic: that.statistic,
				winSign: sign,
				winArr: winArr
			})
		}

		function clearGame(){
			that.game = [new Array(3), new Array(3), new Array(3)]
		}

		// client
		function waiting(){
			that.state = 'waiting'

			io.to(that.id).emit('waiting', {
				link: 'invite_' + that.id,
			})
		}

		function start(){
			that.state = 'started'
			turn = 0 // num in players array
			sign = 'X' // first 

			socketX.emit('start', {turn: true})
			socketO.emit('start', {turn: false})

			/*if(watchmen.length){
				whatchmen.forEach
			}*/
		}

		function nextTurn(){
			if(turn == 0){
				turn = 1
				sign = '0'
			} else {
				turn = 0 
				sign = 'X'
			}

			//emit everyone
			io.to(that.id).emit('nextTurn')
		}

		function restartGame(socket){
			clearGame()

			if(socket == socketX){
				turn = 0 // num in players array
				sign = 'X' // first 

				socketX.emit('restart', {turn: true})
				socketO.emit('restart', {turn: false})
			} else {
				turn = 1
				sign = '0' // first 

				socketX.emit('restart', {turn: false})
				socketO.emit('restart', {turn: true})
			}
		}		

		function sendMessage(msg, from){
			io.to(that.id).emit('chatMessage', {
				msg: msg,
				from: from,
				time: getCurrentTime(),
			})
		}

		function showTyping(sign, socket){
			if(socket == socketX){
				socketO.emit('chatTyping', {
					sign: sign,
					show: true
				})
			} else {
				socketX.emit('chatTyping', {
					sign: sign,
					show: true
				})
			}
		}

		function getCurrentTime(){
			return (new Date()).toLocaleTimeString();
		}

		//external func
		this.addPlayer = addPlayer
		this.removePlayer = removePlayer
		this.checkCell = checkCell
		this.restartGame = restartGame
		this.sendMessage = sendMessage
		this.showTyping = showTyping
	}
}
