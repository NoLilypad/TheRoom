const Logger = require('../modules/Logger.js');

class TaskScheduler {
    constructor(logger) {
        this.logger = logger;
    }


    // Starts deleting old messages at refresh rate in milliseconds
    deleteOldMessagesTask(actions, taskOn, refreshRate, age) {
        this.deleteOldMessagesParams = {};
        this.deleteOldMessagesParams['taskOn'] = taskOn;
        this.deleteOldMessagesParams['refreshRate'] = refreshRate;
        this.deleteOldMessagesParams['age'] = age;


        const runTask = () => {
            console.log('TEST');
            
            if (this.deleteOldMessagesParams['taskOn']){   
                const actionReturn = actions.deleteOldMessagesTS(this.deleteOldMessagesParams['age']);
                this.logger.serverInfo(actionReturn);
            }

            setTimeout(runTask, this.deleteOldMessagesParams['refreshRate']*1000);
        }

        while (true){
            runTask();
        }

        /*
        setInterval(() => {
            if (this.deleteOldMessagesParams['taskOn']){   
                const actionReturn = actions.deleteOldMessagesTS(this.deleteOldMessagesParams['age']);
                this.logger.serverInfo(actionReturn);
            }
        }, this.deleteOldMessagesParams['refreshRate']*1000);
        
        */
    }

  
   
}

module.exports = TaskScheduler;
