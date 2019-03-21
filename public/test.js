var newFormButton = document.getElementById('new-form-button')
var newFormContainer = document.getElementById('new-form-container')

function makeInput(element, type, name, placeholder='', className='') {
  var newInput = document.createElement(element)  
  if (placeholder != '') {
    newInput.placeholder = placeholder
  }
  if (className != '') {
    newInput.setAttribute('class', className)
  }
  if (type == 'text') {
    newInput.setAttribute('required', 'true')
  }
  newInput.setAttribute('lpignore', 'true')  
  newInput.type = type
  newInput.name = name
  return newInput
}

function handleSubmit(event) {
  event.preventDefault()
  var fragment = document.createDocumentFragment()
  var newForm = document.createElement('form')
  newForm.action = '/api/threads/test'
  newForm.method = 'post'
  newForm.appendChild(makeInput('input', 'text', 'board', 'Board'))
  newForm.appendChild(makeInput('textarea', 'text', 'text', 'New Thread'))
  newForm.appendChild(makeInput('input', 'text', 'delete_password', 'Password to Delete'))
  newForm.appendChild(makeInput('input', 'submit', 'Submit Thread'))
  fragment.appendChild(newForm)
  newFormContainer.appendChild(fragment)  
}

newFormButton.addEventListener('submit', handleSubmit)