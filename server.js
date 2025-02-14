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
const taskManager = new TaskManager(logger);
const taskScheduler = new TaskScheduler(logger);
const commandHandler = new CommandHandler(logger);

const actions = new Actions(logger, motdManager, messagesManager, socketManager, taskManager, server, config);


/* ---------------------- App execution ---------------------------*/


socketManager.handleConnections(messagesManager, motdManager);
commandHandler.handleCommands(actions);
taskScheduler.scheduleTasks(taskManager, config.tasks, actions);

/* ---------------------- Middleware execution ---------------------------*/

// Créer une Map pour suivre les utilisateurs actifs
const activeUsers = new Map(); // Format: { username: sessionId }

app.use(express.urlencoded({ extended: true })); 

// Configuration de la session
const sessionStore = new session.MemoryStore(); 
const sessionMiddleware = session({
    secret: 'votre_secret_hyper_securise',
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // Stockage en mémoire (à remplacer par Redis en production)
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000 // 24h
    }
});
app.use(sessionMiddleware);


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
    if (activeUsers.has(username)) {
        return res.redirect('/');
    } 
    
    req.session.username = username;
    activeUsers.set(username, req.session.id);
    res.redirect('/chat');
});

/*
// Route pour le chat
app.use('/chat', express.static(PUBLIC_FOLDER_PATH));
*/

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

// Partager le middleware de session avec Socket.io
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});
// Dans server.js
io.on('connection', (socket) => {
    const username = socket.request.session?.username;
    
    // Ajouter à activeUsers (déjà fait dans /login)
    
    socket.on('disconnect', () => {
        setTimeout(() => {
            // Vérifier si l'utilisateur a d'autres sockets actifs
            const hasOtherSockets = Array.from(io.sockets.sockets).some(
                ([id, s]) => s.request.session?.username === username
            );
            
            if (!hasOtherSockets) {
                activeUsers.delete(username);
                sessionStore.destroy(socket.request.session?.id);
            }
        }, 5000);
    });
});




/* ---------------------- Server start ---------------------------*/

// Starts server 
server.listen(SERVER_PORT, () => {
    logger.serverInfo(`Server launched on port ${SERVER_PORT}`);
});
