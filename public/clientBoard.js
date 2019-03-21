var board = window.location.pathname.replace(/\/b\//g, '').replace('/', '').split('%20').join(' ')
var boardName = document.getElementById('board-name')
var nav = document.getElementById('navigation')
boardName.innerText = board + ' Message Board'

var newThread = document.getElementById('newThread')
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

function addThreadText(thread, type) {
  var threadText = document.createElement('p')
  threadText.innerText = thread[type + '_text']
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

function makeThreadList(threads) {
  var fragment = document.createDocumentFragment()  
  threads.forEach(function(thread) {    
    var threadBox = makeElement('div', {class: 'thread-container'})    
    threadBox.appendChild(makeDetails(thread))        
    threadBox.appendChild(addThreadText(thread, 'thread'))
    // create container to hold all thread replies
    var repliesContainer = makeElement('div', {class: 'replies-container'})    
    var repliesCount = document.createElement('p')
    var hidden = Math.max(0, thread.replycount - 3)
    repliesCount.innerText = thread.replycount.toString() + ' replies total (' + hidden.toString() +
      ' hidden) '
    // If there are replies create anchor to link to thread / replies page
    if (thread.replycount > 0) {
      var threadAnchor = document.createElement('a')    
      threadAnchor.href = '/b/' +board + '/' + thread._id
      threadAnchor.innerText = ' (See full thread here)'
      repliesCount.appendChild(threadAnchor)
    }        
    repliesContainer.appendChild(repliesCount)
    // Create list of replies for each thread
    if (thread.replies.length > 0) {
      thread.replies.forEach(function(reply) {
        // Create reply container
        var replyDiv = makeElement('div', {class: 'reply'})        
        replyDiv.appendChild(makeDetails(reply))        
        replyDiv.appendChild(addThreadText(reply, 'reply'))
        if (reply.reply_text != '[deleted]') {
          var bottomBtns = makeBottomBtns(reply._id, 'reply')          
          replyDiv.appendChild(bottomBtns)          
        }        
        repliesContainer.appendChild(replyDiv)        
      })
    }
    var newReplyForm = makeElement('form', {action: '/api/replies/' + board, method: 'post', 'data-state': 'newReply'})
    var threadId = makeElement('input', {type: 'hidden', name: 'thread_id', value: thread._id})
    newReplyForm.appendChild(threadId)
    var replyTextarea = makeElement('textarea', {class: 'new-thread', name: 'text', placeholder: 'Enter new reply...', required: 'true'})    
    newReplyForm.appendChild(replyTextarea)
    var deletePassword = makeElement('input', {type: 'text', 'data-lpignore': 'true', autocomplete: 'off',
            'class': 'threads-input', name: 'delete_password', placeholder: 'Password to delete', required: 'true'})      
    newReplyForm.appendChild(deletePassword)
    var subBtn = makeElement('button', {'class': 'threads-btn', type: 'submit'})    
    subBtn.innerText = 'Submit New Reply'    
    newReplyForm.appendChild(subBtn)
    repliesContainer.appendChild(newReplyForm)
    threadBox.appendChild(repliesContainer)
    
    var bottomBtns = makeBottomBtns(thread._id, 'thread')    
    threadBox.appendChild(bottomBtns)
    fragment.appendChild(threadBox)    
  })
  threadContainer.appendChild(fragment)
  newThread.setAttribute('action', '/api/threads/' + board)
  threadContainer.addEventListener('submit', handleClick)    
}

function getThreads() {
  sendRequest('GET', '/api/threads/' + board + '/', {}, function(req) {
    var threads = JSON.parse(req.response)    
    makeThreadList(threads)
  })
}

function handleForm(url, method, target, callback) {
  url = url + board  
  var request = {}
  for (var i = 0; i < target.elements.length - 1; i++) {
    var name = target.elements[i].name
    var value = target.elements[i].value    
    request = {...request, [name]: value}    
  }  
  sendRequest(method, url, request, function(req) {
    callback(req.response)    
  })
}

function handleThreadDelete(event) {
  var child = event.parentNode.parentNode
  var parent = child.parentNode    
  parent.removeChild(child)
}

function handleReplyDelete(target) {
  var btnEl = target.parentNode
  var parent = btnEl.parentNode  
  var el = parent.getElementsByTagName('p')[2]
  var reply_id = target.elements[0].value  
  sendRequest('GET', '/api/thread/' + reply_id, {}, function(req) {
    var newReply = JSON.parse(req.response)
    el.innerText = newReply.reply_text
    parent.removeChild(btnEl)
  }) 
}

function handleClick(event) {  
  event.preventDefault();  
  switch (event.target.getAttribute('data-state')) {
    case 'reply-delete':
      handleForm('/api/replies/', 'delete', event.target, function(response) {
        alert(response)
        if (response == 'Success!') {          
          handleReplyDelete(event.target)
          event.target.reset()
        } else {
          event.target.reset()
        }        
      })
      break;
    case 'thread-delete':      
      handleForm('/api/threads/', 'delete', event.target, function(response) {
        alert(response)
        if (response == 'Success!') {
          handleThreadDelete(event.target)
        } else {
          event.target.reset()
        }                
      })
      break;
    case 'reply-report':
      handleForm('/api/replies/', 'put', event.target, function(response) {
        alert(response)        
      })
      break;
    case 'thread-report':
      handleForm('/api/threads/', 'put', event.target,function(response) {
        alert(response)        
      })
      break;
    case 'newReply':      
      event.target.submit()
      break;
  }  
}


getThreads()