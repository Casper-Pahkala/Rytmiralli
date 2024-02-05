const https = require('https');
const express = require('express');
const WebSocket = require('ws');
const app = express();
const fs = require('fs');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/rekrytor.fi/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/rekrytor.fi/fullchain.pem', 'utf8');

const credentials = { key: privateKey, cert: certificate };
const httpsServer = https.createServer(credentials, app);
const ws = new WebSocket.Server({ server: httpsServer });

const moment = require('moment');
require('moment-timezone');

const Lobby = require('./Lobby.js');

var lobbies = [];

ws.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        const buf = Buffer.from(message);
        const str = buf.toString('utf8');
        const data = JSON.parse(str);
        handleClientMessage(ws, data);
    });

    ws.on('close', () => {
        handleClientDisconnect(ws);
    });
});

httpsServer.listen(42069, () => {
    console.log('Server is listening on port 42069');
});

function handleClientDisconnect(ws) {
    console.log('Client disconnected');
    let toDeleteLobbies = [];

    lobbies.forEach(lobby => {
      const player = lobby.players.find(p => p.ws === ws);
      if (player) {
        if (lobby.handlePlayerDisconnect(player)) {
          toDeleteLobbies.push(lobby);
        }
      }
    });

    setTimeout(() => {
      // Delete the lobbies that have 0 players
      toDeleteLobbies.forEach(toDeleteLobby => {
        if (toDeleteLobby.players.length === 0) {
          lobbies = lobbies.filter(l => l.code !== toDeleteLobby.code);
        }
      });
    }, 100000);
}

function handleClientMessage(ws, message) {
    switch (message.action) {
      case 'CREATE_LOBBY':
        createLobby(message, ws);
        break;
      case 'JOIN_LOBBY':
        joinLobby(message, ws);
        break;
      case 'START_GAME':
        startGame(message, ws);
        break;
      case 'PLAY_AGAIN':
        playAgain(message, ws);
        break;
      case 'SELECT_OPTION':
        selectOption(message, ws);
        break;
      case 'NEXT_ROUND':
        nextRound(message, ws);
        break;
    }
}
function nextRound(message, ws) {
  const lobby = lobbies.find(l => l.code === message.code);
  if (lobby) {
    lobby.game.nextRound();
    lobby.syncState();
  } else {
    let payload = {
      action: 'LOBBY_NOT_FOUND',
    };
    sendMessageToClient(payload, ws);
  }
}
function selectOption(message, ws) {
  const lobby = lobbies.find(l => l.code === message.code);
  if (lobby) {
    lobby.game.selectOption(message.player, message.option);
    lobby.syncState();
  } else {
    let payload = {
      action: 'LOBBY_NOT_FOUND',
    };
    sendMessageToClient(payload, ws);
  }
}
function createLobby(message, ws) {
  const lobby = new Lobby(message, ws);
  lobbies.push(lobby);
  return lobby.code;
}

function joinLobby(message, ws) {
    const lobby = lobbies.find(l => l.code === message.code);
    if (lobby) {
      lobby.handlePlayerJoin(message.player, ws);
    } else {
      let payload = {
        action: 'LOBBY_NOT_FOUND',
      };
      sendMessageToClient(payload, ws);
    }
}

function startGame(message) {
  const lobby = getLobby(message.lobby_code);
  if (lobby) {
    lobby.startGame();
  }
}

function playAgain(message, ws) {
  const lobby = getLobby(message.lobby_code);

  if (lobby) {
    lobby.playAgain();
  }
}

function sendMessageToClient(payload, ws) {
  ws.send(JSON.stringify(payload));
}

function getLobby(code) {
  return lobbies.find(l => l.code === code);
}
