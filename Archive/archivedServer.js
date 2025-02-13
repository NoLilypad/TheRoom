// Importation des modules nécessaires
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const favicon = require('serve-favicon');
require('colors');

// Initialisation de l'application Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialisation des constantes 
const intervalInMilliseconds = 60 * 60 * 1000; // Temps d'effaçage en millisecondes - 1h
const dbFilePath = 'db.json'; // Chemin vers db.json
const serverPort = 80; // Port du serveur


// Initialisation des variables globales
var messages = []; // Stockage des messages en RAM
var log_usr_connexion = false; // Si la console log la connexion et déconnexion des utilisateurs
var delete_old_messages = false; // Si le serveur efface les messages datant de plus d'une heure
var nb_users = 0; // Nombre d'utilisateurs connectés
var nb_resets = 0; // Nombre de réinitialisations de l'historique de messages
var MOTD = ''; // Message of the day


// Préfixes de la console 
const prefix_usr_connexion = '[TheRoom - USR]'.yellow.bold; 
const prefix_command       = '[TheRoom - CMD]'.blue.bold;
const prefix_server        = '[TheRoom - SRV]'.green.bold;
const prefix_err           = '[TheRoom - ERR]'.red.bold;







///////////// Fonctions







// Fonction de chargement des messages à partir de db.json, retourne la liste des messages
function loadDB() {
    // Vérifie que le fichier existe pour ne pas lever d'erreur
    if (fs.existsSync(dbFilePath)) {
        // Lit les données du fichier
        const data = fs.readFileSync(dbFilePath, 'utf8');
        // Retourne les données formatées
        return(JSON.parse(data));
    }
}

// Fonction de sauvegarde des messages dans db.json
function writeDB(messagesToWrite){
    // Si db.json n'existe pas, le fichier est créé
    if (!fs.existsSync(dbFilePath)) {
        fs.writeFileSync(dbFilePath, JSON.stringify([]));
    }
    // Ecriture de messages dans le fichier après formatage des données
    fs.writeFileSync(dbFilePath, JSON.stringify(messagesToWrite, null, 2));
}

// Fonction de purge de db.json
function clearDB() {
    // Si db.json n'existe pas, le fichier est créé
    if (!fs.existsSync(dbFilePath)) {
        fs.writeFileSync(dbFilePath, JSON.stringify([]));
    }
    // Efface db.json en écrivant []
    fs.writeFileSync(dbFilePath, JSON.stringify([], null, 2));
}

// Fonction de purge de tous les messages (serveur et clients)
function clearMessages(socket, chatStack){
    // Efface la base de données
    clearDB();
    // Efface les messages de la RAM
    messages = []; 
    // Notifie tous les clients pour qu'ils effacent leur message
    sendChatHistory(socket);
    // Log dans la console
    console.log(`${prefix_command} Les messages ont été supprimés`);
}

// Fonction pour gérer la connexion d'un utilisateur
function handleUserConnection(socket) {
  // Incrémente le nombre d'utilisateurs connectés
  nb_users += 1;
  if (log_usr_connexion) {
    console.log(prefix_usr_connexion + ' Nouvel utilisateur connecté');
  }
}

// Fonction pour gérer la déconnexion de l'utilisateur
function handleUserDisconnection(socket) {
  // Décrémente le nombre d'utilisateurs connectés
  nb_users -= 1;
  if (log_usr_connexion) {
    console.log(prefix_usr_connexion + ' Utilisateur déconnecté');
  }
}

// Fonction pour envoyer l'historique des messages au nouvel utilisateur
function sendChatHistory(socket) {
    socket.emit('sending chat stack', messages);
}

// Fonction pour gérer la réception d'un message
function receiveChatMessage(socket, msg) {
    // Génère le timestamp
    const timestamp = Date.now();
    // Formate le message
    const message = { user: msg.user, text: msg.text, timestamp };
    // L'enregistre en RAM
    messages.push(message);
    // Sauvegarde les messages dans db.json
    writeDB(messages);
    // Diffuse le message à tous les utilisateurs
    socket.emit('chat message', message);
}

// Fonction pour afficher les statistiques demandées
function serverStats(socket, chatStack) {
  // Lire et compter le nombre de messages dans db.json
  fs.readFile(path.join(__dirname, 'db.json'), 'utf8', (err, data) => {
    if (err) {
      console.error('Erreur lors de la lecture du fichier db.json:', err);
      return;
    }

    // Parser les messages pour obtenir un tableau
    const messagesA = JSON.parse(data);
    const messageCount = messagesA.length;

    // Calculer l'uptime du serveur (en secondes)
    const uptime = process.uptime();

    // Obtenir la taille du fichier db.json
    /*
    fs.stat(path.join(__dirname, 'db.json'), (err, stats) => {
      if (err) {
        console.error('Erreur lors de la lecture des stats du fichier:', err);
        return;
      }
    const fileSizeInKB = (stats.size / 1024).toFixed(2); // Taille en KB
    */

    // Afficher les informations dans la console
    console.log(prefix_command + ' Statistiques du serveur');
    console.log(`--- Nombre de messages                  : ${messageCount}`);
    console.log(`--- Nombre d'utilisateurs connectés     : ${nb_users}`);
    console.log(`--- Nombre de réinitialisations du chat : ${nb_resets}`);
    console.log(`--- Uptime du serveur                   : ${uptime.toFixed(2)} secondes`);
    console.log(`--- Log de connexion des utilisateurs   : ${log_usr_connexion}`);
    console.log(`--- Effacement des anciens messages     : ${delete_old_messages}`);
    //console.log(`----Taille de db.json : ${fileSizeInKB} KB`);
    });
};

// Fonction pour activer le log de connexion des utilisateurs dans la console
function toggleLogUserConnexion(socket, chatStack){
  if (log_usr_connexion){
    log_usr_connexion = !log_usr_connexion;
    console.log(`${prefix_command} Log des connexions utilisateur désactivé`);
  }
  else {
    log_usr_connexion = !log_usr_connexion;
    console.log(`${prefix_command} Log des connexions utilisateur activé`);
  }
}

// Fonction pour activer l'effacement des messages régulièrement
function toggleOldMessagesDelete(socket, chatStack){
  if (delete_old_messages){
    delete_old_messages = !delete_old_messages;
    console.log(`${prefix_command} Suppression des anciens messages désactivée`);
  }
  else {
    delete_old_messages = !delete_old_messages;
    console.log(`${prefix_command} Suppression des anciens messages activée`);  }
}



// Fonction pour supprimer les messages datant de plus d'une heure
function deleteOldMessages(socket, chatStack) {
  const currentTime = Date.now(); // Temps actuel en millisecondes
  var buffer = loadDB(); // Liste temporaire des messages à trier
  // Filtrer les messages qui ont été envoyés dans la dernière heure
  const recentMessages = buffer.filter((msg) => {
    // Charge le timestamp du message
    const messageTime = msg.timestamp;
    // Retourne un booléen qui indique si le message est récent
    return (currentTime - messageTime) < intervalInMilliseconds;
  });
  // Ecrit les messages récents dans db.json
  writeDB(recentMessages);
  // Load en RAM les messages
  messages = loadDB();
  // Renvoie la message stacks aux clients
  sendChatHistory(io);
  // Incrémente le nombre de réinitialisations des messages
  nb_resets += 1;
  // Log dans la console
  console.log(`${prefix_server} Chat réinitialisé`);
}

// Fonction pour afficher dans la console la conversation courante
function logChat(socket, chatStack){
  // Log de la commande dans la console
  console.log(`${prefix_command} Historique de chat :`);
  // Pour chaque message 
  chatStack.forEach(message => {
    // Récupère les données du message
    const date = new Date(message.timestamp).toLocaleString();
    const user = message.user;
    const text = message.text;
    // Log les messages dans la console
    console.log(`--- [${date}] ${user} - ${text}`);
  });
}

// Fonction pour afficher de l'aide dans la console
function displayHelp(socket, chatStack){
  console.log(`${prefix_command} Liste des commandes`);
  console.log(`
    clear  : effacer tous les messages
    info   : infos sur le serveur
    loguc  : activer les notifications de connexions dans la console
    delold : effacer les vieux messages
    logc   : afficher la discussion courante
    togdel : activer la suppressions des vieux messages
    help   : afficher la liste des commandes`);
}


// Fonction qui affiche un prompt
function showPrompt() {
  // Attend 100 millisecondes avant d'affiche l'invite de commande sans retour à la ligne
  setTimeout(() => {console.log("")}, 50); 
  setTimeout(() => {process.stdout.write(`>> `)}, 50); 
}


// Fonction qui change le message of the day
function changeMotd(socket, chatStack, motd){
  // Reconstruit le MOTD à partir des arguments de la commande
  //const motd = args.join(' ');
  socket.emit('new motd', motd);
  console.log(`${prefix_command} MOTD envoyé : ${motd}`); 
}

// Fonction qui envoie le motd aux clients
function sendMotd(socket, chatStack, motd){
  // Change le motd 
  MOTD = motd;
  // Envoie le nouveau motd aux clients
  changeMotd(socket, chatStack, motd);
}







//////////// Lancement de l'app







// Indique l'emplacement du favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Chargement des messages à l'initialisation
messages = loadDB();

// Servir les fichiers statiques depuis le dossier 'public'
app.use(express.static('public'));

// remet à 0 le compteur de réinitialisations
nb_resets = 0;



// Gestion des connexions des utilisateurs via WebSocket
io.on('connection', function(socket) {
  handleUserConnection(socket);

  // Envoyer tous les messages existants au nouvel utilisateur
  sendChatHistory(socket);

  // Écouter les messages envoyés par l'utilisateur
  socket.on('client to serv message', function(msg) {
    receiveChatMessage(socket, msg);
  });

  // Gérer la déconnexion
  socket.on('disconnect', function() {
    handleUserDisconnection(socket);
  });


  
  // Easter egg : Chat secret dans la console
  socket.on('consoleMessage', (message) => {
    // Renvoi du message à tous les autres clients
    io.emit('newMessage', message);
  });


  
});


// Lancer le serveur sur le port 80
server.listen(serverPort, () => {
  console.log(`${prefix_server} Serveur lancé sur le port ${serverPort}`);
});



// Exécution toutes les heures de la fonction deleteOldMessages 
if (delete_old_messages){
  setInterval(deleteOldMessages, 10 * 60 * 1000); 
}

// Affiche l'invite de commande au démarrage du serveur
showPrompt();


/////////////// Commandes




// Dictionnaire des commandes
// Note : l'odre des arguments est -> io, messages, args   avec args list de stringdes arguments
const commandMap = {
  "clear" : clearMessages,
  "info"  : serverStats,
  "loguc" : toggleLogUserConnexion,
  "delold": deleteOldMessages,
  "logc"  : logChat,
  "togdel": toggleOldMessagesDelete,
  "help"  : displayHelp,
  "motd"  : changeMotd
}

// Gestion des commandes
process.stdin.on('data', (data) => {
  // Formate l'entrée en une liste d'arguments
  const rawCommand = data.toString().trim().split(' ');
  // Sélectionne la commande avec le premier mot
  const command = rawCommand[0];
  // Supprime la commande des arguments
  rawCommand.shift();
  // Rassemble les arguments avec un espace entre eux en une seule string à donner à la fonction
  const args = rawCommand.join(' ');
  // Si la commande est valide
  if (command in commandMap) {
    commandMap[command](io,messages,args);
  }
  // Si la commande motdn'est pas valide
  else {
    console.log(`${prefix_err} Commande invalide`);
  }
  // Affiche l'invite de commande
  showPrompt();
  });






/////// DEBUG






// Commande test
process.stdin.on('data', (data) => {
    const command = data.toString().trim();
  
    if (command === 't') {
        console.log(messages);
        io.emit('new motd','HEYA');
    }
  });





