require('colors');
const readline = require('readline');

class Logger {
    constructor(prefixes, ifLogUserConnection, rl = null) {
        this.prefixes = prefixes;
        this.ifLogUserConnection = ifLogUserConnection;
        this.rl = rl; // Interface readline pour gérer les logs sans interférer avec les commandes
    }

    logMessage(message) {
        if (this.rl) {
            // Sauvegarde de la ligne en cours d'écriture
            const currentInput = this.rl.line;
            readline.clearLine(process.stdout, 0); // Efface la ligne actuelle
            readline.cursorTo(process.stdout, 0);  // Replace le curseur au début

            console.log(message); // Affiche le message

            // Réaffiche l'invite et restaure l'entrée utilisateur
            process.stdout.write(`>> ${currentInput}`);
        } else {
            console.log(message);
        }
    }

    serverInfo(text = "") {
        this.logMessage(this.prefixes['server'].blue + ' ' + text);
    }

    error(text = "") {
        this.logMessage(this.prefixes['error'].red + ' ' + text);
    }

    userConnection(text = "") {
        if (this.ifLogUserConnection) {
            this.logMessage(this.prefixes['userConnection'].yellow + ' ' + text);
        }
    }

    command(text = "") {
        this.logMessage(this.prefixes['command'].magenta + ' ' + text);
    }

    task(text = "") {
        this.logMessage(this.prefixes['task'].grey + ' ' + text);
    }

    activateLogUserConnection() {
        this.ifLogUserConnection = true;
    }

    deActivateLogUserConnection() {
        this.ifLogUserConnection = false;
    }
}

module.exports = Logger;
