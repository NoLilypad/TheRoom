const schedule = require('node-schedule');


class TaskScheduler {
  constructor(logger) {
    this.logger = logger; // Logger pour les logs
    this.tasks = new Map(); // Stocke les tâches actives par nom
  }

 
  addOrUpdateTask(name, scheduleRule, taskFunction, args, isEnabled = true) {
    // Si une tâche avec ce nom existe déjà, la supprimer
    if (this.tasks.has(name)) {
      this.removeTask(name);
    }

    // Créer une nouvelle tâche
    const job = schedule.scheduleJob(scheduleRule, async () => {
      if (isEnabled) {
        this.logger.task(`Exécution de la tâche "${name}"`);
        await taskFunction(args);
      }
    });

    // Désactiver immédiatement si isEnabled est false
    if (!isEnabled) {
      job.cancel();
    }

    // Ajouter la tâche à la collection
    this.tasks.set(name, { job, scheduleRule, taskFunction, args, isEnabled });
  }

  
  toggleTask(name, isEnabled) {
    const task = this.tasks.get(name);
    if (!task) {
      this.logger.error(`Tâche "${name}" introuvable.`);
      return;
    }

    task.isEnabled = isEnabled;
    if (isEnabled) {
      task.job.reschedule(task.scheduleRule);
      this.logger.serverInfo(`Tâche "${name}" activée.`);
    } else {
      task.job.cancel();
      this.logger.serverInfo(`Tâche "${name}" désactivée.`);
    }
  }

 


  removeTask(name) {
    const task = this.tasks.get(name);
    if (!task) {
      this.logger.error(`Tâche "${name}" introuvable.`);
      return;
    }

    task.job.cancel();
    this.tasks.delete(name);
  }

 
  listTasks() {
    return Array.from(this.tasks.entries()).map(([name, task]) => ({
      name,
      scheduleRule: task.scheduleRule,
      isEnabled: task.isEnabled,
    }));
  }
}

module.exports = TaskScheduler;
