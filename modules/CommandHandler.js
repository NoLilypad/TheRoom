const readline = require('readline');

class CommandHandler {
    constructor(logger) {
        this.logger = logger;
    }

    handleCommands(actions) {
        // Creates an empty map for commands
        const commands = new Map();
        // List of commands, with their aliases and Actions functions
        const commandList = [
            { aliases: ['clear', 'c'], func: actions.messagesClear.bind(actions) },
            { aliases: ['loguc', 'yuc'], func: actions.activateLogUserConnection.bind(actions) },
            { aliases: ['nologuc', 'nuc'], func: actions.deActivateLogUserConnection.bind(actions) },
            { aliases: ['deleteoldmessages', 'delold'], func: actions.deleteOldMessages.bind(actions) },
            { aliases: ['changemotd', 'cm', 'motd'], func: actions.changeMotd.bind(actions) },
            { aliases: ['infos', 'info', 'i'], func: actions.getServerInfo.bind(actions) },
            { aliases: ['help', 'h'], func: actions.getConsoleHelp.bind(actions) },
            { aliases: ['shutdown', 'sd'], func: actions.shutdown.bind(actions) },
            { aliases: ['t', 'test'], func: actions.test.bind(actions) },
            { aliases: ['tasks', 'taskslist', 'tl'], func: actions.getTaskList.bind(actions) },
            { aliases: ['edomt'], func: actions.enableDOMT.bind(actions) },
            { aliases: ['ddomt'], func: actions.disableDOMT.bind(actions) },
            { aliases: ['dump','d'], func: actions.dumpFormattedMessages.bind(actions) },
            { aliases: ['admin','adm','a'], func: actions.sendAdminMessage.bind(actions) }
        ];
        // Fills the commands map
        commandList.forEach(command => {
            command.aliases.forEach(alias => {
                commands.set(alias, command.func);
            });
        });

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '>> ',
        });

        this.logger.rl = rl; // Connecte readline au logger

        rl.prompt();

        rl.on('line', (line) => {
            const args = line.trim().split(' ');
            const commandName = args.shift();
            const command = commands.get(commandName);

            if (command) {
                const commandReturn = command(args);
                this.logger.command(commandReturn);
            } 
            else {
                this.logger.command('No such command');
            }

            rl.prompt();
        }).on('close', () => {
            this.logger.serverInfo('Command interface closed');
            process.exit(0);
        });
    }
}

module.exports = CommandHandler;
