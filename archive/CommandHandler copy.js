const Logger  = require('../modules/Logger.js');


class CommandHandler {

    constructor(logger){
        this.logger = logger;
    }


    handleCommands(actions) {

        // Creates an empty map for commands
        const commands = new Map();
        // List of commands, with their aliases and Actions functions
        const commandList = [
            { aliases: ['clear', 'c'],                  func: actions.messagesClear.bind(actions) },
            { aliases: ['loguc', 'yuc'],                func: actions.activateLogUserConnection.bind(actions)},
            { aliases: ['nologuc', 'nuc'],              func: actions.deActivateLogUserConnection.bind(actions)},
            { aliases: ['deleteoldmessages', 'delold'], func: actions.deleteOldMessages.bind(actions)},
            { aliases: ['changemotd','cm','motd'],      func: actions.changeMotd.bind(actions)},
            { aliases: ['infos','info','i'],            func: actions.serverInfo.bind(actions)},
            { aliases: ['help','h'],                    func: actions.getHelp.bind(actions)},
            { aliases: ['shutdown', 'sd'],              func: actions.shutdown.bind(actions)},
            { aliases: ['dmon'],                        func: actions.activateDeleteOldMessagesTask.bind(actions)},
            { aliases: ['dmoff'],                       func: actions.deActivateDeleteOldMessagesTask.bind(actions)},  
            { aliases: ['dmset'],                       func: actions.setDeleteOldMessagesTaskParams.bind(actions)},          
            { aliases: ['t','test'],                    func: actions.test.bind(actions) }
            
        ];
        // Fills the commands map
        commandList.forEach(command => {
            command.aliases.forEach(alias => {
                commands.set(alias, command.func);
            });
        });

        
        
       
        // When text is entered in the console
        process.stdin.on('data', (data) => {
            // Gets command arguments
            const args = data.toString().trim().split(' ');
            // Gets command name
            const commandName = args.shift();
            //console.log(this.commands);
            // Gets command's function
            const command = commands.get(commandName);  
            
            // Executs command if it exists  
            if (command){
                const commandReturn = command(args);
                this.logger.command(commandReturn);
            }
            else{
                this.logger.command('No such command');
            }

           
         
        });
    }
}









module.exports = CommandHandler;
