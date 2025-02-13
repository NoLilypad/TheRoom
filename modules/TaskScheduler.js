class TaskScheduler{
    constructor(logger){
        this.logger = logger;
    }

    scheduleTasks(taskManager, tasksConfig, actions){
        // Write here the tasks schedule

        // Delete old messages task
        taskManager.addOrUpdateTask("deleteOldMessages", 
            `*/${tasksConfig.deleteOldMessagesTask.taskRate} * * * *`, 
            actions.deleteOldMessages.bind(actions), 
            [tasksConfig.deleteOldMessagesTask.ageForDelete], 
            tasksConfig.deleteOldMessagesTask.deleteOldMessages);
    }  
}

module.exports = TaskScheduler;