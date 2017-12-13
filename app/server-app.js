const l = console.log

module.exports = function(app, io, gameRooms, players) {
	io.on('connection', socket => {
		var player = {
			id: socket.id,
			room: undefined,
		}
		//var player_ID = socket.id;
		//var player_room = undefined;
		//l(socket.id, 'connected');


		socket.on('connection', url => {
			// check invite and connect or create new room
			var invite_ID = url.match(/invite_(.*)/i)
			if(!invite_ID){
				createRoom(player)
			} else {
				invite_ID = invite_ID[1]
				l('invite_ID : ', invite_ID)
				roomConnect(invite_ID, player)
			}
		})

		socket.on('disconnect', props => {
			if(player.room)	player.room.removePlayer(player.id)
		})

		socket.on('checkCell', item =>{
			player.room.checkCell(player, item)
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
			//redirect ??
			createRoom(player)
		}
	}

	function Room(id){
		var that = this;
		var socketX, socketO, whatchmen;

		// is it important to make props accessible from the outside???
		this.id = id
		this.players = []
		this.turn = undefined
		this.sign = undefined
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
			that.players.push(newPlayer_ID)
			var socket = io.sockets.connected[newPlayer_ID];
			socket.join(that.id)

			checkCountOfPlayers()
		}

		function removePlayer(player_ID){
			var index = that.players.indexOf(player_ID);
			if(index == -1) return
			that.players.splice(index,1)
			
			checkCountOfPlayers()
		}

		function checkCountOfPlayers(){
			if(that.players.length >= 2){
				socketX = io.sockets.connected[that.players[0]];
				socketO = io.sockets.connected[that.players[1]];
				if(that.players.length > 2) whatchmen = that.players.slice(2);

				if(that.state != 'started'){
					start()
				} else {
					 // give watchmen emit 'watch'
				}

			} else if(that.players.length == 0){
				//remove room
				l('remove room please')

			} else if(that.players.length < 2) {
				waiting()
			}
		}
		
		function checkCell(player, cell){
			if(that.players[that.turn] != player.id){
				l('not this player turn!')
				return
			}

			if(that.game[cell.row][cell.cell] === undefined){
				that.game[cell.row][cell.cell] = that.turn

				l('that turn : ', that.turn)

				io.to(that.id).emit('place', {
					cell: cell,
					sign: that.sign,
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

			// 1
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

			// 2
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

			// 3 d-1
			elem1 = game[0][0];
			if(elem1 != undefined){
				isSame = true

				for(var i = 1; i < 3; i++){
					elemCurrent = game[i][i]
					if(elemCurrent != elem1){
						l('elemCurrent :', elemCurrent, '   elem1', elem1)
						isSame = false
					}
				}
				
				if(isSame){
					endGame('win', [
						[0,0], [1,1], [2,2]
					])
					return true
				}
			}

			// 4 d-2
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


			/*for(var i = 0; i < 3; i++){
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
				}
			} */



			/*var arrays = [
				//horisontal
				[game[0][0], game[0][1], game[0][2]],
				[game[1][0], game[1][1], game[1][2]],
				[game[2][0], game[2][1], game[2][2]],
				//vertical
				[game[0][0], game[1][0], game[2][0]],
				[game[0][1], game[1][1], game[2][1]],
				[game[0][2], game[1][2], game[2][2]],
				//diagonal
				[game[0][0], game[1][1], game[2][2]],
				[game[0][2], game[1][1], game[2][0]],
			]


			var currentArr
			var emptyCells = false 
			
			for(var i = 0; i < arrays.length; i++){
				currentArr = arrays[i];
				var isEverySame = currentArr.every( item => {
					if(item == undefined) emptyCells = true
					return (item != undefined) && (item == currentArr[0])
				})
				
				if(isEverySame){
					endGame('win', currentArr)
					l(currentArr)
					return true
				}
			}

			if(!emptyCells){
				endGame('draw')
				return true
			}
			

			return false*/
		}

		function endGame(state, winArr){
			l(' END GAME ')

			switch(state){
				case 'win'	: 
							that.statistic[that.sign]++
							l('WINNER : ', that.sign)
							break;
				case 'draw'	: 
							that.statistic.draw++
							l('DRAW')
							break;
			}

			io.to(that.id).emit('endGame', {
				state: state,
				win: that.sign,
				statistic: that.statistic,
			})
		}

		function clearGame(){

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
			that.turn = 0 // line num in players array
			that.sign = 'X' // first 

			socketX.emit('start', {turn: true})
			socketO.emit('start', {turn: false})

			/*if(watchmen.length){
				whatchmen.forEach
			}*/
		}

		function nextTurn(){
			if(that.turn == 0){
				that.turn = 1
				that.sign = '0'
			} else {
				that.turn = 0 
				that.sign = 'X'
			}

			//emit everyone
			io.to(that.id).emit('nextTurn')
		}

		

		//external func
		this.addPlayer = addPlayer
		this.removePlayer = removePlayer
		this.checkCell = checkCell
	}
}
