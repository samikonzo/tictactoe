var l = console.log;
var wrapper = document.getElementsByClassName('wrapper')[0];
var mask = document.getElementsByClassName('mask')[0];
var game = new Battlefield(wrapper, mask, socket);


socket.on('waiting', props => {
	game.waiting(props.link)
})

socket.on('start', props => {
	game.start(props.turn)
})

socket.on('place', props => {
	game.place(props.cell, props.sign)
})

socket.on('nextTurn', props => {
	game.nextTurn()
})

socket.on('endGame', props => {
	var state = props.state
	var statistic = props.statistic
	var winSign = props.winSign
	var winArr = props.winArr
	game.endGame(state, statistic, winSign, winArr)
})

socket.on('restart', props=> {
	game.restart(props.turn)
})

socket.on('enable', yes => {
	if(yes) game.enable()
	else game.disable()
})

socket.on('chatMessage', props => {
	var msg = props.msg
	var from = props.from
	var time = props.time

	game.newMessage(msg, from, time)
})

socket.on('chatTyping', props => {
	var sign = props.sign

	game.showTyping(sign)
})


function Battlefield(wrap, mask, socket){
	const infobar = wrap.getElementsByClassName('infobar')[0]
	const infobarSignPlayer = infobar.getElementsByClassName('infobar-signs__player')[0]
	const infobarSignTurn = infobar.getElementsByClassName('infobar-signs__turn')[0]
	const infobarWinsX = infobar.getElementsByClassName('infobar__wins-X')[0]
	const infobarWins0 = infobar.getElementsByClassName('infobar__wins-0')[0]
	const infobarWinsDraw = infobar.getElementsByClassName('infobar__wins-draw')[0]
	const playground = wrap.getElementsByClassName('playground')[0]
	const popup = wrap.getElementsByClassName('popup')[0]
	const popupMessage = popup.getElementsByClassName('popup__message')[0]
	const restartBtn = popup.getElementsByClassName('popup__restart-button')[0]
	const chat = wrap.getElementsByClassName('chat')[0]
	const chatLog = chat.getElementsByClassName('chat__log')[0]
	const chatInput = chat.getElementsByClassName('chat__input')[0]
	const chatSendBtn = chat.getElementsByClassName('chat__send')[0]
	const maskLink = mask.getElementsByClassName('mask__inviteLink')[0]

	var stats = {};
	var playerTurn = false;
	var playerSign = undefined;
	var playerEnemySign = undefined;
	var chatShowTyping,chatShowTimer;
	
	/*
	*	Listeners
	*/
	playground.onclick = function(e){
		var target = e.target;

		if(target.nodeName != 'TD') return
		if(!playerTurn || !playground.enable) return
		if(target.buzy) return

		var item = {
			row : target.parentElement.sectionRowIndex, 
			cell : target.cellIndex,
		}

		socket.emit('checkCell', item)
		playgroundDisable()
	}

	mask.onclick = function(e){
		// create temp input for 'copy from' source
		var tempInput = document.createElement('input');
		tempInput.style.cssText = `position: absolute; opacity:0;`
		document.body.appendChild(tempInput)

		// place link into temp input 
		tempInput.value = maskLink.innerHTML;
		tempInput.select()

		// copy to clipboard
		document.execCommand("copy")

		// remove temp input
		tempInput.remove()

		// create copy-message
		var copyMessage = document.createElement('div');
		copyMessage.innerHTML = 'copied!';
		copyMessage.classList.add('copyMessage');
		copyMessage.style.cssText = `
			position: absolute;
			top: ${e.clientY}px;
			left: ${e.clientX}px;
			opacity: 1;
			transition: 1s linear;
			user-select: none;
		`
		
		// place copy message
		document.body.appendChild(copyMessage);

		// fly and delete
		setTimeout(() => {
			copyMessage.style.top = e.clientY - 100 + 'px';
			copyMessage.style.opacity = 0;

			//remove 
			setTimeout(()=>{
				copyMessage.remove()
			},1000)
		}, 10)
	}

	restartBtn.onclick = function(e){

		socket.emit('restartGame')
	}

	/////////////////////////////////////

	/*
	*	Chat
	*/
	chatInput.onkeypress = function(e){
		if(e.which == 13){
			sendMessage()
			return
		} 
	}

	chatInput.onkeydown = function(e){
		socket.emit('chatTyping', {
			sign: playerSign
		})
	}

	chatSendBtn.onclick = function(e){
		sendMessage()
	}

	function sendMessage(){
		var msg = chatInput.value;
		if(msg == '') return

		socket.emit('chatMessage', {
			from: playerSign,
			msg: msg,
		})
		chatInput.value = ''
		return false
	}

	this.newMessage = function(msg, from, time){
		var block = document.createElement('div');
		block.classList.add('message');

		if(from != playerSign){
			block.classList.add('message--enemy')
			this.removeTyping()
		} else {
			block.classList.add('message--my')
		}		

		block.innerHTML = `<span class="message__time">${time}</span>
						   <span class="message__name">${from}</span> : 
						   <span class="message__text">${msg}</span>`;

		chatLog.appendChild(block);
		chatLog.scrollTop = chatLog.scrollHeight;				   
	}

	this.showTyping = function(sign){
		l('showTyping!!')
		if(!chatShowTyping){
			l('create shower')
			var block = document.createElement('div');
			block.classList.add('message-typing');

			//block.innerHTML = `<span class="message-typing__name">${sign}</span> <span class="message-typing__circle">.</span>`
			block.innerHTML = `противник печатает сообщение <span class="message-typing__circle">.</span> <span class="message-typing__circle">.</span> <span class="message-typing__circle">.</span>`

			chatLog.appendChild(block)
			chatLog.scrollTop = chatLog.scrollHeight;

			chatShowTyping = block

			chatShowTimer = setTimeout(function(){
				block.remove()
				chatShowTyping = undefined;
			},1000)
			
		} else {
			clearTimeout(chatShowTimer)
			chatShowTimer = setTimeout(function(){
				chatShowTyping.remove()
				chatShowTyping = undefined;
			},1000)
		}
	}

	this.removeTyping = function(){
		clearTimeout(chatShowTimer)
		if(chatShowTyping){
			chatShowTyping.remove()
			chatShowTyping = undefined;
		}
	}

	/////////////////////////////////////

	function infobarSignRefresh(){
		infobarSignPlayer.innerHTML = playerSign
		infobarSignTurn.innerHTML = playerTurn ? playerSign : playerEnemySign
	}

	function infobarStatsRefresh(){
		if(infobarWinsX.innerHTML != stats.X) infobarStatHideChangeShow(infobarWinsX, stats.X)
		if(infobarWins0.innerHTML != stats['0']) infobarStatHideChangeShow(infobarWins0, stats[0])
		if(infobarWinsDraw.innerHTML != stats.draw)	infobarStatHideChangeShow(infobarWinsDraw, stats.draw)
	}	

	function infobarStatHideChangeShow(stat, newValue){
		stat.style.opacity = 0;
		setTimeout(function(){
			stat.innerHTML = newValue
			stat.style.opacity = ''
		}, 1000)
	}

	function wrapShow(){
		wrap.style.opacity = 1;
	}

	function wrapHide(){
		wrap.style.opacity = 0;
	}

	function maskShow(){
		mask.style.display = 'flex';
		setTimeout(()=>{
			mask.style.opacity = 1;
		}, 10)
	}

	function maskHide(){
		mask.style.opacity = 0
		setTimeout(()=>{
			mask.style.display = 'none';
		}, 1000)
	}

	function popupShow(){
		popup.style.display = 'flex';
		//show popup
		setTimeout(function(){
			popup.style.opacity = 1;
		}, 100)

		//show restart button
		setTimeout(function(){
			restartBtn.style.opacity = 1;
		},1000)
	}

	function popupHide(){
		popup.style.opacity = ''
		restartBtn.style.opacity = ''			
		setTimeout(function(){
			popup.style.display = '';
		}, 1000)
	}

	function yourTurn(){
		playerTurn = true;
		playgroundEnable();
		infobarSignRefresh()
	}

	function enemyTurn(){
		playerTurn = false;
		playgroundDisable()
		infobarSignRefresh()
	}

	function playgroundClear(){
		//save tds links
		if(!playground.tds){
			playground.tds = [];
			[].forEach.call(playground.querySelectorAll('td'), td => {
				playground.tds.push(td);
			})
		}

		//clear tds
		playground.tds.forEach( td => {
			td.style.opacity = 0
			
			var wasEnabled = false
			if(playground.enable){ 
				wasEnabled = true
				playgroundDisable()
			}	

			setTimeout(function(){
				td.innerHTML = ''
				if(wasEnabled) playgroundEnable()
			}, 1000)
			delete td.buzy
		})
	}

	function playgroundEnable(){
		playground.enable = true
		playground.classList.remove('playground--disabled')
	}

	function playgroundDisable(){
		playground.enable = false
		playground.classList.add('playground--disabled')
	}

	this.waiting = function(link){
		var href = window.location.href.split('invite')[0]
		maskLink.textContent = href + link;
		maskLink.href = maskLink.textContent

		wrapHide()
		maskShow()
	}

	this.start = function(turn){
		maskHide()
		popupHide()
		wrapShow()
		playgroundClear()

		if(turn){
			playerSign = 'X'
			playerEnemySign = '0'
			yourTurn()
		} else {
			playerSign = '0'
			playerEnemySign = 'X'
			enemyTurn()
		}
	}

	this.nextTurn = function(){
		if(playerTurn){
			enemyTurn()
		} else {
			yourTurn()
		}
	}

	this.place = function(cell, sign){
		var td = playground.rows[cell.row].cells[cell.cell];
		td.buzy = true;
		td.innerHTML = sign		
		td.style.opacity = 1;
	}

	this.endGame = function(state, statistic, winSign, winArr){
		popup.classList.remove('popup--fail')
		popup.classList.remove('popup--win')
		popup.classList.remove('popup--draw')

		stats = statistic
		infobarStatsRefresh()

		switch(state){
			case 'draw' :
						popup.classList.add('popup--draw')
						popupMessage.innerHTML = 'Ничья :|'
						popupShow()
						break;
			case 'win'	:
						if(winSign == playerSign){
							popup.classList.add('popup--win')
							popupMessage.innerHTML = 'Вы победили :D'
						} else {
							popup.classList.add('popup--fail')
							popupMessage.innerHTML = 'Вы проиграли'
						}
						popupShow()
						break;
		}
		//l(winArr)
		//highlight winarr!
	}

	this.restart = function(turn){
		maskHide()
		popupHide()
		wrapShow()
		playgroundClear()

		if(turn){
			yourTurn()
		} else {
			enemyTurn()
		}
	}



	this.disable = playgroundDisable
	this.enable = playgroundEnable
}

