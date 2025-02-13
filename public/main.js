/* ---------------------- Const setup ---------------------------*/


// WebSocket connection
const socket = io();

// Get DOM elements
const messagesList = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message');
const usernameInput = document.getElementById('username');
const motd = document.getElementById('motd');

const messageTypes = {0: "none", 1:"admin"};


/* --------------------- Functions setup -------------------------*/

// Escapes special characters in html
function escapeHtml(unsafeText) {
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// Sends message to server
function sendMessage(){
  const user = usernameInput.value.trim();
  const text = messageInput.value.trim();
  // Checks for non-null username and message
  if (user && text) {
    socket.emit('client to serv message', { user, text });
    messageInput.value = '';
  } 
}

// Adds message to html
function addMessage(message) {
  // Generate readable timestamp
  const date = new Date(message.timestamp).toLocaleString();
  // Adds message to the chat
  const li = document.createElement('li');
  li.innerHTML = `
  <span class="${messageTypes[message.flag]}">
    <span class="meta">
      <span class="date">${escapeHtml(date)}</span> - 
      <span class="username">${escapeHtml(message.user)}</span>:
    </span>
    <span class="text">${escapeHtml(message.text)}</span>
  </span>
  `;
  messagesList.appendChild(li); 
  // Scrolls the list
  messagesList.scrollTop = messagesList.scrollHeight;
}   

// Clears page's chat
function clearMessages() {
  messagesList.innerHTML = '';
}




/* ---------------------- Event handling ---------------------------*/



// When receiveing whole message stack
socket.on('message stack broadcast', (messages) => {
  clearMessages();
  messages.forEach(addMessage);
});

// When receiving one new message
socket.on('message broadcast', (message) => {
  addMessage(message);
});

// When receiving new message of the day
socket.on('new motd', (motdText) =>{
  motd.textContent = motdText;
});





/* ---------------------- Input handling ---------------------------*/

// Sending a message when clicking on "Send"
sendBtn.addEventListener('click', () => {
  sendMessage();
});

// Sending a message when pressing enter key in the messageInput zone
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
}); 






