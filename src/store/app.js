// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    websocket: null,
    baseUrl: 'rekrytor.fi',
    websocketStatus: 'Disconnected',
    lobby: null,
    router: null,
    player: {
      id: null,
      name: '',
    },
    audio: null,
  }),
  actions: {
    sendWebsocketMessage(payload) {
      if (this.websocketStatus == 'Connected' && this.websocket) {
        this.websocket.send(JSON.stringify(payload));
      } else {
        setTimeout(() => {
          this.sendWebsocketMessage(payload);
        }, 500);
      }
    },
    connectToWebsocket() {
     console.log('CONNECTING TO WS');
     if (this.websocket && this.websocket.readyState !== 3) {
       console.log('WebSocket connection is already open or in progress.');
       return;
     }

     this.websocket = new WebSocket('wss://' + this.baseUrl + ':42069');

     this.websocket.addEventListener('open', () => {
       this.websocketStatus = 'Connected';
       console.log('Connected to ws');
     });

     this.websocket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('Message received:', data);
        this.handleWSMessage(data);
     });

     this.websocket.addEventListener('close', () => {
       this.websocketStatus = 'Closed';
       setTimeout(() => {
         this.connectToWebsocket();
       }, 1000);
     });
   },
   createLobby() {
     const payload = {
       action: 'CREATE_LOBBY',
       player: this.player
     };
     this.sendWebsocketMessage(payload);
   },
   handleWSMessage(data) {
    switch(data.action) {
      case 'LOBBY_CREATED':
        this.lobbyCreated(data);
        break;
      case 'LOBBY_JOINED':
        this.lobby = data.lobby;
        this.player.id = data.uid;
        localStorage.setItem('player_id', data.uid);
        this.router.push({
          name: 'Lobby',
          params: {
            code: this.lobby.code
          },
        });
        console.log('Lobby joined', this.lobby);
        break;
      case 'LOBBY_NOT_FOUND':
        this.router.replace({
          name: 'Home'
        })
        break;
      case 'STATE_UPDATE':
        this.onStateUpdate(data);
        break;
      case 'ROUND_START':
        this.onRoundStart(data);
        break;
      case 'ROUND_END':
        // this.onRoundStart(data);
        break;
    }
   },
   onRoundStart(data) {
    let currentRound = data.round;

    if (this.lobby.game) {
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
      this.audio = new Audio('http://159.89.96.65/music/' + this.lobby.game.rounds[currentRound - 1].song);
      setTimeout(() => {
        this.audio.play();
      }, 300);
    }
   },
   onStateUpdate(data) {
    let lobby = data.lobby;
    // if (lobby.game) {
    //   lobby.game.rounds.forEach(round => {
    //     round.audio = round.audio ||
    //   })
    // }
    this.lobby = lobby;
   },
   lobbyCreated(data) {
    this.lobby = data.lobby;
    this.player.id = data.uid;
    localStorage.setItem('player_id', data.uid);
    this.router.push({
      name: 'Lobby',
      params: {
        code: this.lobby.code
      },
    });
    console.log('Lobby created', this.lobby);
   },
   joinLobby(code) {
     const payload = {
       action: 'JOIN_LOBBY',
       code: code,
       player: this.player
     };
     this.sendWebsocketMessage(payload);
   },
   startGame() {
    const payload = {
      action: 'START_GAME',
      lobby_code: this.lobby.code,
    }
    this.sendWebsocketMessage(payload);
   },
   selectOption(index) {
    const payload = {
      action: 'SELECT_OPTION',
      option: index,
      player: this.player,
      code: this.lobby.code,
    }
    this.sendWebsocketMessage(payload);
   },
   nextRound() {
    const payload = {
      action: 'NEXT_ROUND',
      code: this.lobby.code,
    }
    this.sendWebsocketMessage(payload);
   }
  },
  getters: {
    isHost() {
      if (this.lobby && this.lobby.host === this.player.id) {
        return true;
      }
      return false;
    },
    connectedPlayers() {
      if (this.lobby && this.lobby.players) {
        return this.lobby.players.filter(p => p.state === 1);
      }
      return [];
    }
  }
})
