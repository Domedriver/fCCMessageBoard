var msgBoardList = document.getElementById('message-board-list')
var newThreadForm = document.getElementById('newThread')

function sendRequest(method, url, request={}, callback) {
  var req = new XMLHttpRequest
  req.open(method, url, true)
  req.setRequestHeader('Content-Type', 'application/json')
  req.send(JSON.stringify(request))
  req.onload = function() {
    callback(req)
  }  
}

function getMessageBoards() {
  sendRequest('GET', '/api/messageBoards', {}, function(req) {
    var boards = JSON.parse(req.response) 
    boards.sort(function(a, b) {
      return a.toUpperCase() < b.toUpperCase() ? -1 : 1
    })
    var fragment = document.createDocumentFragment()
    boards.forEach(function(board) {
      var link = document.createElement('a')
      link.href = '/b/' + board + '/'
      //link.href = '/test/'
      link.innerText = board;
      fragment.appendChild(link)
    })
    msgBoardList.appendChild(fragment)    
  })  
}

function handleNewThread(event) {  
  event.preventDefault()
  var board = newThreadForm.elements.board.value
  var postForm = {
    board: board,
    text: newThreadForm.elements.text.value,
    delete_password: newThreadForm.elements.delete_password.value
  }
  sendRequest('POST', '/api/threads/' + board, postForm, function(req) {    
    window.location.pathname = req.responseURL.replace('https://marvelous-ring.glitch.me/', '')
  })  
}


getMessageBoards()

newThreadForm.addEventListener('submit', handleNewThread)

