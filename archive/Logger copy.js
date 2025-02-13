require('colors');


class Logger{

    constructor(prefixes, ifLogUserConnection){
        // Loads prefixes
        this.prefixes = prefixes;
        // If user connections should be logged in the console
        this.ifLogUserConnection = ifLogUserConnection;
    }

    // To log server state information
    serverInfo(text = ""){
        console.log(' ');
        console.log(this.prefixes['server'].blue + ' ' + text); 
        this.commandPrompt();
    }

    // To log an error
    error(){
        console.log(' ');
        console.log(this.prefixes['error'].red + ' ' + text); 
        this.commandPrompt();
    }
    
    // To log user connections
    userConnection(text = ""){        
        if (this.ifLogUserConnection){  
            console.log(' ');
            console.log(this.prefixes['userConnection'].yellow + ' ' + text);  
            this.commandPrompt();
        }
    }

    // To log the result of a command
    command(text = ""){
        console.log(' ');
        console.log(this.prefixes['command'].magenta + ' ' + text);
        this.commandPrompt();
    }

    // Logs command prompt in console
    commandPrompt() {
        // Waits 100 milliseconds to wait for commands to execute
        setTimeout(() => {console.log("")}, 50); 
        setTimeout(() => {process.stdout.write(`>> `)}, 50); 
    }

    // To toggle logging user connexion
    activateLogUserConnection(){
        this.ifLogUserConnection = true;
    }
    deActivateLogUserConnection(){        
        this.ifLogUserConnection = false;
    }
}


module.exports = Logger;