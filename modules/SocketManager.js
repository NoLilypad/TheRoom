class SocketManager {
    
    constructor(io, logger) {
        this.io = io; 
        this.logger = logger;  
        this.nbConnected = 0;      
    }

    broadcastMessages(messagesToBroadcast){
        this.io.emit('message stack broadcast', messagesToBroadcast);
    }

    broadcastMessage(messageToBroadcast){
        this.io.emit('message broadcast', messageToBroadcast);
    }

    broadcastMotd(motdToBroadcast){
        this.io.emit('new motd', motdToBroadcast);
    }

    sendMessages(messagesToSend, socket){
        socket.emit('message stack broadcast', messagesToSend);
    }

    sendMessage(messageToSend, socket){
        socket.emit('message broadcast', messageToSend);
    }

    sendMotd(motdToSend, socket){
        socket.emit('new motd', motdToSend);
    }

    getNbConnected(){
        return this.nbConnected;
    }
    
    // Handles user connection
    handleConnections(messagesManager, motdManager) {
        this.io.on('connection', (socket) => {
                        
            this.nbConnected += 1;
            this.logger.userConnection('User connection');
            
            // Sends chat stack at connection
            this.sendMessages(messagesManager.getMessages(), socket);
            // Sends motd at connection
            this.sendMotd(motdManager.getMotd(), socket)

            // Handles reception of user messages
            socket.on('client to serv message', (msg) => {
                // Retrieves username of the session
                const username = socket.request.session?.username;
                if (!username) {
                    socket.disconnect();
                    return;
                }
                // Adds new message to messages stack
                const newMessage = messagesManager.addMessage({
                    user: username,
                    text: msg.text,
                    flag: msg.flag || 0
                }); 
                // Broadcasts message to all clients
                this.broadcastMessage(newMessage);
            });
            
            // Handles user disconnexion
            socket.on('disconnect', () => {
                this.nbConnected -= 1;
                this.logger.userConnection('User disconnection');
            });
        });
    }

}

module.exports = SocketManager;
