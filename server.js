/* --------------------- Modules import -------------------------*/

const express         = require('express');
const http            = require('http');
const socketIo        = require('socket.io');
const fs              = require('fs');
const YAML            = require('yaml');
const path            = require('path');
const session         = require('express-session');

const MessagesManager = require('./modules/MessagesManager.js');
const Logger          = require('./modules/Logger.js');
const MotdManager     = require('./modules/MotdManager.js');
const SocketManager   = require('./modules/SocketManager.js');
const SessionManager  = require('./modules/SessionManager.js');
const TaskManager     = require('./modules/TaskManager.js');
const TaskScheduler   = require('./modules/TaskScheduler.js')
const CommandHandler  = require('./modules/CommandHandler.js');
const Actions         = require('./modules/Actions.js');


/* ----------------------- App Setup ----------------------------*/

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


/* --------------------- Variables Setup -------------------------*/

// YAML Configuration loading
const config = YAML.parse(fs.readFileSync('./config.yaml','utf8')); 
            
const LOCAL_DB_PATH = config.dbFilePath;           
const PUBLIC_FOLDER_PATH = path.join(__dirname, config.publicFolderPath); 
const SERVER_PORT = config.serverPort;


/* ------------------ Instanciates modules -----------------------*/

const logger = new Logger(config.logger.prefixes, config.logger.logUserConnection);

const motdManager = new MotdManager(config.motd);
const messagesManager = new MessagesManager(LOCAL_DB_PATH);
const socketManager = new SocketManager(io, logger);
const sessionManager = new SessionManager(io, session, logger);
const taskManager = new TaskManager(logger);
const taskScheduler = new TaskScheduler(logger);
const commandHandler = new CommandHandler(logger);

const actions = new Actions(logger, motdManager, messagesManager, socketManager, sessionManager, taskManager, server, config);


/* ---------------------- App execution ---------------------------*/


socketManager.handleConnections(messagesManager, motdManager);
commandHandler.handleCommands(actions);
taskScheduler.scheduleTasks(taskManager, config.tasks, actions);

sessionManager.manageSessions();

/* ---------------------- Middleware execution ---------------------------*/

app.use(express.urlencoded({ extended: true })); 

app.use(sessionManager.sessionMiddleware);


// Route GET pour la page de login
app.get('/', (req, res) => {
    // Redirige vers /chat si la session avec username existe
    if (req.session.username) {
        res.redirect('/chat');
    } 
    // Sinon ouvre la page login.html
    else {
        res.sendFile(path.join(PUBLIC_FOLDER_PATH, 'login.html'));
    }
});


// Route POST pour traiter le login
app.post('/login', (req, res) => {
    // Créé l'username à partir du résultat du forms et vérifie qu'il est non vide
    const username = req.body.username.trim();
    if (!username) {
        return res.redirect('/?error=Nom d\'utilisateur requis');
    }
    
    // Rediriger vers / si le nom est déjà utilisé
    if (sessionManager.activeUsers.has(username)) {
        return res.redirect('/');
    } 
    
    req.session.username = username;
    sessionManager.activeUsers.set(username, req.session.id);
    res.redirect('/chat');
});


// Route protégée pour le chat
app.get('/chat', (req, res) => {
    if (!req.session.username) {
        res.redirect('/');
    } else {
        res.sendFile(path.join(PUBLIC_FOLDER_PATH, 'index.html'));
    }
});

// Servir les fichiers statiques du dossier public
app.use('/', express.static(PUBLIC_FOLDER_PATH));



/* ---------------------- Server start ---------------------------*/

// Starts server 
server.listen(SERVER_PORT, () => {
    logger.serverInfo(`Server launched on port ${SERVER_PORT}`);
});
