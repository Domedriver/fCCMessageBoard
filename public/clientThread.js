
var [board, thread_id] = window.location.pathname.replace(/\/b\//g, '').split('/')
board = board.split('%20').join(' ')
var boardName = document.getElementById('board-name')
var boardLocation = document.getElementById('board-location')
boardLocation.href = '/b/' + board + '/'
boardLocation.innerText = 'Back to ' + board + ' threads'
boardName.innerText = board + ' Message Board -- Thread Detail'

var threadContainer = document.getElementById('thread-container')


function sendRequest(method, url, request={}, callback) {
  var req = new XMLHttpRequest
  req.open(method, url, true)
  req.setRequestHeader('Content-Type', 'application/json')
  req.send(JSON.stringify(request))
  req.onload = function() {
    callback(req)
  }  
}

function makeElement(element, obj) {
  var newElement = document.createElement(element)  
  Object.keys(obj).forEach(function (el) {    
    newElement.setAttribute(el, obj[el])    
  })
  return newElement
}

function makeDetails(thread) {
  var details = makeElement('div', {class: 'one-line'})
  var created = document.createElement('p')
  created.innerText = 'Created: ' + new Date(thread.created_on ).toLocaleString()
  var threadId = document.createElement('p')
  threadId.innerText = '(id: ' + thread._id + ')'
  details.appendChild(created)
  details.appendChild(threadId)
  return details
}

function addThreadText(text) {
  var threadText = makeElement('p', {class: 'thread-text'})  
  threadText.innerText = text
  return threadText
}

function makeBottomBtns(id, type) {
  var bottomBtns = makeElement('div', {class: 'one-line'})  
  var deleteForm = makeElement('form', {class: 'bottom-btn-form', 'data-state': type + '-delete'})  
  var inputId = makeElement('input', {type: 'hidden', name: type + '_id', value: id})
  deleteForm.appendChild(inputId)  
  var inputDelete = makeElement('input', {type: 'text', 'data-lpignore': 'true', autocomplete: 'off',
    'class': 'threads-input', name: 'delete_password', placeholder: 'Password to delete', required: 'true'})  
  deleteForm.appendChild(inputDelete)
  var delBtn = makeElement('button', {class: 'threads-btn', type: 'submit'})
  delBtn.innerText = 'Delete ' + type.charAt(0).toUpperCase() + type.slice(1)
  deleteForm.appendChild(delBtn)
  bottomBtns.appendChild(deleteForm)
  var reportForm = makeElement('form', {class: 'bottom-btn-form', 'data-state': type + '-report'})
  var reportId = makeElement('input', {type: 'hidden', name: type + '_id', value: id})
  reportForm.appendChild(reportId)
  var reportBtn = makeElement('button', {type: 'submit', 'class': 'threads-btn'})
  reportBtn.innerText = 'Report ' + type.charAt(0).toUpperCase() + type.slice(1)
  reportForm.appendChild(reportBtn)
  bottomBtns.appendChild(reportForm)
  return bottomBtns
}

function makeReply(reply) {
  var replyDiv = makeElement('div', {class: 'reply'})
  replyDiv.appendChild(makeDetails(reply))
  replyDiv.appendChild(addThreadText(reply.reply_text))
  if (reply.reply_text != '[deleted]') replyDiv.appendChild(makeBottomBtns(reply._id, 'reply'))
  return replyDiv
}

function getReplies() {
  sendRequest('GET', '/api/replies/' + board + '?thread_id=' + thread_id, {}, function(req) {
    var result = JSON.parse(req.response)
    var replies = result.replies
    // Create html for replies
    var fragment = document.createDocumentFragment()
    var threadBox = makeElement('div', {class: 'thread-container'})        
    threadBox.appendChild(makeDetails(result))        
    threadBox.appendChild(addThreadText(result.thread_text))
    // create container to hold all thread replies
    var repliesContainer = makeElement('div', {class: 'replies-container'})    
    result.replies.forEach(function(reply) {            
      repliesContainer.appendChild(makeReply(reply))        
      })
    var newReplyForm = makeElement('form', {method: 'post', 'data-state': 'newReply', action: '/api/replies/' + board})
    var threadId = makeElement('input', {type: 'hidden', name: 'thread_id', value: thread_id})
    newReplyForm.appendChild(threadId)
    var replyTextarea = makeElement('textarea', {class: 'new-thread', name: 'text', 
                                  placeholder: 'Enter new reply...', required: 'true'})    
    newReplyForm.appendChild(replyTextarea)
    var deletePassword = makeElement('input', {class: 'threads-input', 'data-lpignore': 'true', 
      autocomplete: 'off', required: 'true', type: 'text', name: 'delete_password', placeholder: 'Password to delete'})    
    newReplyForm.appendChild(deletePassword)
    var subBtn = makeElement('button', {class: 'threads-btn', type: 'submit'})    
    subBtn.innerText = 'Submit New Reply'    
    newReplyForm.appendChild(subBtn)
    repliesContainer.appendChild(newReplyForm)    
    threadBox.appendChild(repliesContainer)
    fragment.appendChild(threadBox)
    threadContainer.appendChild(fragment)
    threadContainer.addEventListener('submit', handleSubmit)    
  })
}

function createRequest(method, event, callback) {
  var request = {}
  for (let i = 0; i < event.target.elements.length - 1; i++) {
    var name = event.target.elements[i].name;
    var value = event.target.elements[i].value;
    request = {...request, [name]: value}
  }
  sendRequest(method, '/api/replies/' + board, request, function(req) {
    callback(req)
  })
}

function handleReplyDelete(target) {  
  var reply_id = target.elements[0].value
  var child = target.parentNode
  var parent = child.parentNode
  console.log('parent is: ', parent)
  console.log('child is: ', child)
  var replyText = parent.querySelector('.thread-text')
  sendRequest('get', '/api/thread/' + reply_id, {}, function(req) {
    var result = JSON.parse(req.response)
    replyText.innerText = result.reply_text
    parent.removeChild(child)
  })  
}

function handleSubmit(event) {
  event.preventDefault()
  switch (event.target.getAttribute('data-state')) {
    case 'reply-delete':      
      createRequest('delete', event, function(req) {
        alert(req.response)
        if (req.response != 'Success!') {
          event.target.reset()
        } else {
          handleReplyDelete(event.target)
          event.target.reset()
          console.log('delete was correct -- handleDelete')
        }
      })
      break;
    case 'reply-report':
      createRequest('put', event, function(req) {
        alert(req.response)        
      })
      break;
    case 'newReply':
      createRequest('post', event, function(req) {
        var result = JSON.parse(req.response)
        var repliesBox = document.querySelector('.replies-container')
        repliesBox.prepend(makeReply(result.replies[0]))
        event.target.reset()
      })      
      break;
  }
}


getReplies()

/*
case 'newReply':
      event.target.submit()
      break;

*/