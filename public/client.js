var l = console.log;
var wrapper = document.getElementsByClassName('wrapper')[0];
var mask = document.getElementsByClassName('mask')[0];
var game = new Battlefield(wrapper, mask);


socket.on('waiting', props => {
	game.waiting(props.link)
})

socket.on('start', props => {
	game.start(props.turn)
})

socket.on('nextTurn', props => {
	//deploy new enemy position
	//deploy new your position
	//allow next turn
})

socket.on('endGame', props => {
	// win or false?
})


function Battlefield(wrap, mask){
	const infobar = wrap.getElementsByClassName('infobar')[0]
	const playground = wrap.getElementsByClassName('playground')[0]
	const chat = wrap.getElementsByClassName('chat')[0]
	const maskLink = mask.getElementsByClassName('mask__inviteLink')[0]

	var stats = {};
	var playerTurn = false;
	var playerSign = undefined;

	/*
	*	Listeners
	*/
	playground.onclick = function(e){
		var target = e.target;

		if(target.nodeName != 'TD') return
		if(!playerTurn) return
		if(target.buzy) return

		var item = {
			row : target.parentElement.sectionRowIndex, 
			cell : target.cellIndex,
		}

		l(item)

		socket.emit('checkCell', item)
		/*target.buzy = true;
		target.innerHTML = playerSign;*/


		/*enemyTurn()*/
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

	/////////////////////////////////////

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

	function yourTurn(){
		playerTurn = true;
		playgroundEnable();
	}

	function enemyTurn(){
		playerTurn = false;
		playgroundDisable()
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
			td.innerHTML = ''
			delete td.buzy;
		})
	}

	function playgroundEnable(){
		playground.classList.remove('playground--disabled')
	}

	function playgroundDisable(){
		playground.classList.add('playground--disabled')
	}

	this.waiting = function(link){
		var href = window.location.href.split('/invite')[0]
		maskLink.textContent = href + link;
		maskLink.href = maskLink.textContent

		wrapHide()
		maskShow()
	}

	this.start = function(turn){
		maskHide()
		wrapShow()
		playgroundClear()

		if(turn){
			playerSign = 'X';
			yourTurn()
		} else {
			enemyTurn()
		}
	}

	this.nextTurn = function(){}
}