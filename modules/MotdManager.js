class MotdManager{
    constructor(defaultMotd){
        this.motd = defaultMotd;
    }

    setMotd(newMotd){
        this.motd = newMotd;
    }

    getMotd(){
        return this.motd;
    }
}






module.exports = MotdManager;