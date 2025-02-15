class SessionManager{
    constructor(io, session, logger){
        this.io = io;
        this.session = session;
        this.logger = logger;
        this.activeUsers = new Map(); // Format: { username: sessionId }
        this.sessionStore = new this.session.MemoryStore(); 
        this.sessionMiddleware = this.session({
            secret: 'votre_secret_hyper_securise',
            resave: false,
            saveUninitialized: false,
            store: this.sessionStore, // Stockage en mémoire (à remplacer par Redis en production)
            cookie: { 
                maxAge: 24 * 60 * 60 * 1000 // 24h
            }
        });
    }

    manageSessions(){

        this.io.use((socket, next) => {
            this.sessionMiddleware(socket.request, {}, next);
        });

        this.io.on('connection', (socket) => {
            const username = socket.request.session?.username;

            // Envoyer l'username au client
            socket.emit("send username", username);
            
            // Ajouter à activeUsers (déjà fait dans /login)
            
            socket.on('disconnect', () => {
                setTimeout(() => {
                    // Vérifier si l'utilisateur a d'autres sockets actifs
                    const hasOtherSockets = Array.from(this.io.sockets.sockets).some(
                        ([id, s]) => s.request.session?.username === username
                    );
                    
                    if (!hasOtherSockets) {
                        this.activeUsers.delete(username);
                        this.sessionStore.destroy(socket.request.session?.id);
                    }
                }, 5000);
            });
        });

    }
}

module.exports = SessionManager;