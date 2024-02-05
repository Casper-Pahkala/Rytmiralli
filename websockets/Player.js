const playerStates = require('./PlayerStates.js');

class Player {
    constructor(id, name, ws) {
        this.id = id;
        this.name = name;
        this.ws = ws;
        this.state = playerStates.JOINED;
        this.points = 0;
    }

    joinLobby(player, ws) {
        this.state = playerStates.JOINED;
        this.ws = ws;
        this.name = player.name
    }

    disconnect() {
        this.state = playerStates.DISCONNECTED;
    }
}

module.exports = Player;
