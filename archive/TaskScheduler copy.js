// modules/TaskScheduler.js
const cron = require('node-cron');

// Module TaskScheduler
class TaskScheduler {
  constructor(logger) {
    this.logger = logger; // On utilise le logger pour loguer les actions
  }

  // Exemple d'une tâche récurrente : suppression des anciens messages
  deleteOldMessagesTask(actions, isEnabled, intervalMinutes, daysBefore) {
    if (isEnabled) {
      const cronExpression = `*/${intervalMinutes} * * * *`; // Exemple : toutes les `intervalMinutes` minutes

      cron.schedule(cronExpression, async () => {
        this.logger.serverInfo(`Tâche planifiée : Suppression des messages plus vieux de ${daysBefore} jours`);
        await actions.deleteOldMessages(daysBefore);
      });

      this.logger.serverInfo(`Tâche de suppression des anciens messages planifiée toutes les ${intervalMinutes} minutes.`);
    } else {
      this.logger.serverInfo('Tâche de suppression des anciens messages désactivée.');
    }
  }

  // Autres tâches peuvent être ajoutées ici selon le besoin
}

module.exports = TaskScheduler;
