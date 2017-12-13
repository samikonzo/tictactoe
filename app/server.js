const l = console.log

module.exports = function(app, io, fields, players) {
	l('connected')	

	io.on('connection', socket => {
		var player_ID = socket.id;
		socket.emit('getName', player_ID)
		l(`player ${player_ID} connected`)
				
		var currentGame = null;


		// check generated id! its must be one!
		// no need to, cuz there is player_ID
		//var game_ID = generateID()

		// create new game
		var game = new Game(player_ID, io)
		fields.addGame(game)


		/*socket.emit('waiting', {
			//maybe wrong ip
			link: socket.handshake.headers.host + '/invite_' + game_ID,
		})*/


		socket.on('disconnect', () => {
			l(`player ${player_ID} disconnected`)
		})
	})	
}

/*
*	Player Constructor
*/
function Player(){}


/*
*	Game Constructor
*/
function Game(player_ID, io){
	/*var players = [player_ID];
	var	state = null;*/
	var that = this;
	this.players = [];
	this.state = null;

	Object.defineProperty(this, 'state', {
		get: function(){
			return null
		},

		set: function(newState){

		},
	})

	function start(){
		io.to(that.id).emit('start', {})
		/*that.players.forEach(player => {
			var socket = io.sockets.connected[player]
			socket.emit('start', {})
		})*/
	}

	function waiting(){
		io.to(that.id).emit('waiting', {
			link: 'invite_' + that.id,
		})
	}

	function getState(){}

	function addPlayer(newPlayer_ID){
		that.players.push(newPlayer_ID)
		
		// player to the room
		var socket = io.sockets.connected[newPlayer_ID];
		/*l(' ')
		l(' ')
		l(io.sockets.connected)*/
		socket.join(that.id)

		if(that.players.length == 2){
			start()
		} else {
			waiting()
		}
	}

	

	this.getState = getState;
	this.id = player_ID;
	//this.start = start;
	this.addPlayer = addPlayer;

	addPlayer(player_ID)
}

/*
*	ID Generator
*/
function generateID(){
	return Math.random().toString(36).slice(2)
}