// must be here for init socket!
//var socket = io();


var l = console.log;
var wrapper = document.getElementsByClassName('wrapper')[0];
var mask = document.getElementsByClassName('mask')[0];
var maskLink = mask.getElementsByClassName('mask__inviteLink')[0];


mask.show = function(){
	this.style.display = 'flex';

	//no need for that=this, cus es6 =>
	setTimeout(()=>{
		this.style.opacity = 1;
	}, 10)
}

mask.hide = function(){
	this.style.opacity = 0

	setTimeout(()=>{
		this.style.display = 'none';
	}, 1000)
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
	copyMessage.innerHTML = 'copy!';
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


socket.on('waiting', props => {
	maskLink.textContent = window.location.href + props.link;
	maskLink.href = maskLink.textContent
	mask.show()
})

socket.on('start', () => {
	l(' START ')
})