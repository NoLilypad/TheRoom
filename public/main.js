/* ---------------------- Const setup ---------------------------*/


// WebSocket connection
const socket = io();

// Get DOM elements
const messagesList = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message');
const motd = document.getElementById('motd');

const messageTypes = {0: "none", 1:"admin"};


/* --------------------- Functions setup -------------------------*/

function isAtBottom() {
  const threshold = 40; // Marge d'erreur en pixels
  return messagesList.scrollTop + messagesList.clientHeight >= messagesList.scrollHeight - threshold;
}

// Escapes special characters in html
function escapeHtml(unsafeText) {
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function linkify(text) {
  const escapedText = escapeHtml(text); // Échappe d'abord le HTML
  // Regex pour détecter les URLs (http/https/www.)
  const urlRegex = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]|www\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  return escapedText.replace(urlRegex, (url) => {
    let href = url;
    if (!href.startsWith('http')) href = `http://${href}`; // Corrige les www. sans http
    return `<a href="${href}" target="_blank" rel="noopener">${url}</a>`;
  });
}


// Sends message to server
function sendMessage(){
  const text = messageInput.value.trim();
  // Checks for non-null username and message
  if (text) {
    socket.emit('client to serv message', {text });
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
    <span class="text">${linkify(message.text)}</span>
  </span>
  `;

  const wasAtBottom = isAtBottom(); // Vérification avant ajout
  messagesList.appendChild(li); 
  // Scrolls the list
  if (wasAtBottom) {
    messagesList.scrollTop = messagesList.scrollHeight; // Scroll si nécessaire
  }
}   

// Clears page's chat
function clearMessages() {
  messagesList.innerHTML = '';
}
 



/* ---------------------- Event handling ---------------------------*/

window.onload = (event) => {
  messageInput.focus();
}

// Après la connexion WebSocket (const socket = io();)
socket.on("connect", () => {
  // Demander l'username au serveur
  socket.emit("get username");
});

// Réception de l'username
socket.on("send username", (username) => {
  const usernameInput = document.getElementById("username");
  usernameInput.value = username; // Afficher l'username
});

// When receiveing whole message stack
socket.on('message stack broadcast', (messages) => {
  clearMessages();
  messages.forEach(addMessage);
  messagesList.scrollTop = messagesList.scrollHeight; // Scroll vers le bas
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






