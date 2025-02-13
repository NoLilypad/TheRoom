/* --------------------- Modules import -------------------------*/

const express         = require('express');
const http            = require('http');
const socketIo        = require('socket.io');
const fs              = require('fs');
const YAML            = require('yaml');

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
const PUBLIC_FOLDER_PATH = config.publicFolderPath;
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

// Serves files from public folder
app.use('/', express.static(PUBLIC_FOLDER_PATH));

// Starts server 
server.listen(SERVER_PORT, () => {
    logger.serverInfo(`Server launched on port ${SERVER_PORT}`);
});
