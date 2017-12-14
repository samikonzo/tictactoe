const express		= require('express')
const app			= express()
const http 			= require('http').Server(app)
const io 			= require('socket.io')(http)
const reload		= require('reload')
const PORT 			= process.env.PORT || 3000
const l 			= console.log

var players = []
var gameRooms = {
	rooms : {},

	addRoom : function(room){
		var id = room.id
		this.rooms[id] = room;

		var link = '/invite_' + id

		app.get(link, (req, res) => {
			res.sendFile(__dirname + '/public/index.html')
		})
	},

	removeRoom : function(roomID){
		delete this.rooms[roomID]
	}
}


/*
* browser reloader / just for dev
*/
reload(app)


/* 
*	link to socket logic 
*/
require('./app/server-app.js')(http, io, gameRooms, players)

/*
*	index page
*/
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html')
})

/*
*	connect by invite
*/
app.get('/invite_:id', (req, res) => {
	res.sendFile(__dirname + '/public/index.html')
})


app.use(express.static('public'))



http.listen(PORT, ()=>{
	l(`We are listening port :` + PORT)
}) 

