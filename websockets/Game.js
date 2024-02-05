const { IN_PROGRESS } = require('./GameStates');

const fs = require('fs').promises;

const directoryPath = '/var/www/rytmiralli/music/';

var allSongs = [];

async function getFileNames() {
  try {
    const files = await fs.readdir(directoryPath);
    allSongs = files;
  } catch (err) {
    console.error('Error reading directory', err);
  }
}

getFileNames();

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getRandomSongs() {
  let songs = shuffleArray(allSongs);
  return songs.slice(0, 20);
}

function getRandomOptions(correctSong) {
  let songs = shuffleArray(allSongs.filter(s => s !== correctSong));
  return songs.slice(0, 4);
}

class Round {
  constructor(song) {
    this.song = song;
    this.options = shuffleArray(getRandomOptions(song).concat(song));
    this.playerGuesses = [];
    this.round_ended = false;
    this.roundStartedAt = new Date();
  }

  startRound() {
    this.roundStartedAt = new Date();
    setTimeout(() => {
      this.round_ended = true;
    }, 1000 * 30);
  }
}

class Game {
  constructor(players) {
    this.players = players;
    let rounds = [];
    let randomSongs = getRandomSongs();
    randomSongs.forEach((song) => {
      rounds.push(new Round(song));
    });

    this.rounds = rounds;
    console.log('Game started');
    this.changeRound(1);
  }

  changeRound(round) {
    const currentRound = this.rounds[round - 1];
    currentRound.startRound();
    this.currentRound = round;
    console.log(`Round ${round} started with song ${this.rounds[this.currentRound - 1].song}`);
    this.players.forEach(player => {
      player.optionSelected = false;
    });
  }

  nextRound() {
    this.currentRound++;
    this.changeRound(this.currentRound);

    const payload = {
      action: 'ROUND_START',
      round: this.currentRound,
    };
    this.sendMessageToClients(payload);
  }

  sendMessageToClients(payload) {
    this.players.forEach(player => {
      player.ws.send(JSON.stringify(payload));
    });
  }

  selectOption(player, index) {
    const currentRound = this.rounds[this.currentRound - 1];
    const selectedOption = currentRound.options[index];

    if (currentRound.round_ended) {
      return;
    }

    console.log(`${player.name} guessed song ${selectedOption}`)

    if (player.optionSelected) {
      return;
    }
    player.optionSelected = true;
    currentRound.playerGuesses.push({
      player: player,
      guess: {
        index: index,
        name: selectedOption,
      },
    });

    if (selectedOption === currentRound.song) {
      if (player.points) {
        player.points += 1;
      } else {
        player.points = 1;
      }
    }
    console.log('correct: ', selectedOption === currentRound.song);
    console.log('player', player);
    if (currentRound.playerGuesses.length === this.players.length) {
      currentRound.round_ended = true;
    }

  }
}

module.exports = Game;
