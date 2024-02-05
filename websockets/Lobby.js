const gameStates = require('./GameStates.js');
const Player = require('./Player.js');
const Game = require('./Game.js');
class Lobby {
  constructor(message, ws) {
    const code = generateRandomInt();
    const playerId = this.generatePlayerId();
    const player = new Player(
    playerId,
    message.player.name,
    ws,
    );

    this.players = [player];
    this.game = null;
    this.gameState = gameStates.NOT_STARTED;
    this.host = playerId;
    this.code = code;

    const payload = {
        action: 'LOBBY_CREATED',
        lobby: this,
        uid: playerId
    };

    ws.send(JSON.stringify(payload));

    setInterval(() => {
      this.syncState();
    }, 1000);
  }

  generatePlayerId() {
      return Math.floor(100000000 + Math.random() * 900000000);
  }

  handlePlayerJoin(newPlayer, ws) {
    let playerInLobby = this.players.find(p => p.id === newPlayer.id);
    let playerId = null;
    if (playerInLobby) {
        playerId = newPlayer.id;
        playerInLobby.joinLobby(newPlayer, ws);
    } else {
        playerId = this.generatePlayerId();
        const player = new Player(
            playerId,
            newPlayer.name,
            ws,
        );
        this.players.push(player)
    }
    this.syncState();

    const payload = {
        action: 'LOBBY_JOINED',
        lobby: this,
        uid: playerId
    };
    ws.send(JSON.stringify(payload));
    console.log('player joined:', newPlayer);
  }

  handlePlayerDisconnect(player) {
    player.disconnect();
    let deleteLobby = false;
    if (this.players.length < 1) {
        deleteLobby = true;
    } else if (this.host === player.id) {
        this.host = this.players[0].id;
    }
    this.syncState();
    console.log('Player disconnected: ' + player.name);
    return deleteLobby;
  }

  startGame() {
    this.game = new Game(this.players);
    this.syncState();
    const payload = {
      action: 'ROUND_START',
      round: 1,
    };
    this.sendMessageToClients(payload);
    this.syncState();
  }

  syncState() {
    const lobby = this;
    this.players.forEach(player => {
        const payload = {
            action: 'STATE_UPDATE',
            lobby,
        };
        player.ws.send(JSON.stringify(payload));
    });
  }

  sendMessageToClients(payload) {
    this.players.forEach(player => {
      player.ws.send(JSON.stringify(payload));
    });
  }
}

function generateRandomInt() {
  return Math.floor(1000 + Math.random() * 9000);
}

module.exports = Lobby;
