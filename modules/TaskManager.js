const schedule = require('node-schedule');

class TaskManager {
  constructor(logger) {
    this.logger = logger; // Logger pour les logs
    this.tasks = new Map(); // Stocke les tâches actives par nom
  }

  addOrUpdateTask(name, scheduleRule, taskFunction, args, isEnabled = true) {
    // Si une tâche avec ce nom existe déjà, la supprimer
    if (this.tasks.has(name)) {
      this.removeTask(name);
    }

    // Créer une nouvelle tâche (mais ne pas la planifier si isEnabled est false)
    const job = isEnabled
      ? schedule.scheduleJob(scheduleRule, async () => {
          if (isEnabled) {
            this.logger.task(`Exécution de la tâche "${name}"`);
            await taskFunction(args);
          }
        })
      : null;

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
      // Replanifier la tâche si elle était annulée
      if (!task.job) {
        task.job = schedule.scheduleJob(task.scheduleRule, async () => {
          if (task.isEnabled) {
            this.logger.task(`Exécution de la tâche "${name}"`);
            await task.taskFunction(task.args);
          }
        });
      } else {
        task.job.reschedule(task.scheduleRule);
      }
    } else {
      // Annuler la tâche si elle est désactivée
      if (task.job) {
        task.job.cancel();
        task.job = null;
      }
    }
  }

  removeTask(name) {
    const task = this.tasks.get(name);
    if (!task) {
      this.logger.error(`Tâche "${name}" introuvable.`);
      return;
    }

    if (task.job) {
      task.job.cancel();
    }
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

module.exports = TaskManager;
