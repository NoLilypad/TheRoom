const fs = require('fs');


class MessagesManager{

    // Constructor loads messages from db
    constructor(dbPath){
        this.dbPath = dbPath;
        
        // Creates db.json if not found
        if (!fs.existsSync(this.dbPath)) {
            fs.writeFileSync(this.dbPath, JSON.stringify([]));
        }

        // Creates message stack
        this.messages = this.read();
    }

    // Reads messages from db
    read(){
        // Reads db data
        const data = fs.readFileSync(this.dbPath, 'utf8');
        // Returns message stack
        return JSON.parse(data);
    }

    // Writes messages to db
    save(messagesToSave = this.messages){
        // Writes messages to db
        fs.writeFileSync(this.dbPath, JSON.stringify(messagesToSave, null, 2));
    }

    // Purges messages in local memory (db and RAM)
    clear(){
        // Resets messages in RAM
        this.messages = [];
        // Writes empty messages to db
        fs.writeFileSync(this.dbPath, JSON.stringify(this.messages, null, 2));
        return this.messages;
    }


    // Add new message to messages stack
    addMessage(messageToAdd){        
        // Creates timestamp
        const timestamp = Date.now();
        // Formats message
        const message = { user: messageToAdd.user, text: messageToAdd.text, timestamp, flag: messageToAdd.flag || 0};
        // Adds message to RAM
        this.messages.push(message);
        // Adds messages to db
        this.save(this.messages);
        // Returns the message with timestamp and flag
        return message;
    }

    // Returns messages
    getMessages() {
        return this.messages;
    }



    deleteOldMessages(age){
        const currentTime = Date.now(); // Current timestamp in milliseconds
        // Filters messages if they are older than the age argument
        const recentMessages = this.messages.filter((message) => {
            // Retourne un booléen qui indique si le message est récent
            return (currentTime - message.timestamp) < age;
        });
        // Calculates number of deleted messages
        const nbDeletedMessages = this.messages.length - recentMessages.length;
        // Saves buffer to db
        this.save(recentMessages);
        this.messages = recentMessages;
        // Returns number of deleted messages
        return nbDeletedMessages;
    }

    getNbMessages(){
        return this.messages.length;
    }
    
    test(){
        console.log(this.messages);
    }
}







module.exports = MessagesManager;