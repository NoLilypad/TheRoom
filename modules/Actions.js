class Actions{

   constructor(logger, motdManager, messagesManager, socketManager, sessionManager, taskScheduler, server, config){
      this.logger = logger;
      this.motdManager = motdManager;
      this.messagesManager = messagesManager;
      this.socketManager = socketManager;
      this.sessionManager = sessionManager;
      this.taskScheduler = taskScheduler; 
      this.server = server;
      this.config = config;
   }

   messagesClear(){
      const emptyMessages = this.messagesManager.clear();
      this.socketManager.broadcastMessages(emptyMessages);
      return 'Successfully cleared messages';
   }

   activateLogUserConnection(){
      this.logger.activateLogUserConnection();
      return 'User connection log activated';
   }

   deActivateLogUserConnection(){
      this.logger.deActivateLogUserConnection();
      return 'User connection log deactivated';
   }

   deleteOldMessages(args){
      // Argument #0 is age
      let age = args[0] || 10; 
      // Converts age to milliseconds
      age = age * 1000;     
      const nbDeletedMessages = this.messagesManager.deleteOldMessages(age);
      const messages = this.messagesManager.getMessages();
      
      this.socketManager.broadcastMessages(messages);
      return `Successfully deleted ${nbDeletedMessages} messages`;
   }

   changeMotd(args){
      const newMotd = args.join(' ');
      this.motdManager.setMotd(newMotd);
      this.socketManager.broadcastMotd(this.motdManager.getMotd());
      return `Successfully changed motd to ${newMotd}`;
   }

   enableDOMT(){
      this.taskScheduler.toggleTask("deleteOldMessages", true);
      return('Task "deleteOldMessages" enabled');
   } 

   disableDOMT(){
      this.taskScheduler.toggleTask("deleteOldMessages", false);
      return('Task "deleteOldMessages" disabled');
   }

   dumpFormattedMessages(){
      function formatTimestamp(timestamp) {
         const date = new Date(timestamp);
         return date.toLocaleString(); }
      const messages = this.messagesManager.getMessages();
      // Checks if there are messages
      if (messages.length == 0){
         return('No messages');
      }
      // Créer une chaîne formatée pour chaque message
      return messages
         .map((message) => {
            return `\n${formatTimestamp(message.timestamp)} - ${message.user} : ${message.text}`;
      })
      .join(""); 


   }

   sendAdminMessage(args){
      const text = args.join(' ');
      const message = {user: "Admin", text: text, flag: 1};
      const messageToSend = this.messagesManager.addMessage(message);
      this.socketManager.broadcastMessage(messageToSend);
      return('Admin message sent');
   }


   getTaskList(){
      let tasks = this.taskScheduler.listTasks();
      if (tasks.length == 0) {
         return "There are no current tasks running";
      }

      let taskList = tasks.map(task => {
         const { name, scheduleRule, isEnabled } = task;
         return `
         Task: ${name}
         - Schedule Rule:   ${scheduleRule}
         - Status       :   ${isEnabled ? 'Enabled' : 'Disabled'}`;
      }).join('\n'); 


      return(taskList);

   }

   getServerInfo(){
      const currentMotd = this.motdManager.getMotd();
      const nbMessages = this.messagesManager.getNbMessages();
      const uptimeSeconds = process.uptime();
      const uptimeFormated = new Date(uptimeSeconds * 1000).toISOString().substr(11, 8);
      const nbConnected = this.socketManager.getNbConnected();
      const nbSessions = this.sessionManager.activeUsers.size;

      return `Server infos : 
         Current motd                 : ${currentMotd}
         Number of messages           : ${nbMessages}
         Number of connected sockets  : ${nbConnected}
         Number of connected sessions : ${nbSessions}
         Server uptime                : ${uptimeFormated}`;
   }

   getConsoleHelp(){
      return(this.config.help.consoleHelp);
   }

   shutdown(){
      // Saves messages
      this.messagesManager.save(this.messagesManager.messages);
      this.server.close(() => {
         process.exit(0);
      });
      return('Shutting down')
   }   

   

   test(args){
      //this.socketManager.broadcastMessage({"user":"testUser", "text":"Message ici","timestamp":1737073890031, "flag": 1});
    

   }

}


module.exports = Actions;





