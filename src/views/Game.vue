<template>
  <div class="game-container">
    <div class="round-header">
      <h1>
        Round {{ game.currentRound }}
      </h1>

      <div class="seconds-left">
        <v-icon>
          mdi-timer-outline
        </v-icon>
        {{ secondsLeftInRound }}
      </div>
    </div>

    <div class="song-container">
      <div v-if="currentRound.round_ended" class="song-name">
        {{ currentRound.song.split('.mp3')[0] }}
      </div>

      <v-skeleton-loader
        v-else
        width="400px"
        height="40px"
        boilerplate
      />
    </div>

    <div class="options">
      <v-card
        v-for="(option, index) in currentOptions"
        :key="index"
        class="option"
        :class="{
          selected: selectedIndex === index,
          disabled: (selectedIndex !== null && selectedIndex !== index) || currentRound.round_ended,
          'correct-choice': currentRound.round_ended && option === currentRound.song && selectedIndex === index,
          'correct': currentRound.round_ended && option === currentRound.song,
          'wrong-choice': currentRound.round_ended && option !== currentRound.song && selectedIndex === index,
        }"
        :disabled="selectedIndex !== null || currentRound.round_ended"
        elevation="8"
        @click="selectOption(index)"
      >
        {{ option.split('.mp3')[0] }}
      </v-card>
    </div>

    <v-btn
      :disabled="!currentRound.round_ended"
      color="primary"
      append-icon="mdi-chevron-right"
      width="400px"
      size="large"
      @click="store.nextRound()"
    >
      Next round
    </v-btn>
  </div>

  <v-card
    elevation="2"
    class="players-container"
  >
    <div
      class="player-name"
      :class="{ disconnected: player.state === 0 }"
      v-for="(player, index) in store.lobby.players"
      :key="index"
    >
      <div>
        {{ player.name }}
        <v-icon
          v-if="store.lobby.host === player.id"
          class="ml-1"
          style="font-size: 16px; padding-bottom: 4px;"
        >
          mdi-crown
        </v-icon>

        <v-icon
          v-if="player.state === 0"
          class="ml-1"
          style="color: rgba(255, 0, 0, 0.7); font-size: 16px;"
        >
          mdi-connection
        </v-icon>
      </div>

      {{ player.points }}
    </div>
  </v-card>

</template>
<script setup>
import { useAppStore } from '@/store/app';
import { computed, watch, onUnmounted, onMounted } from 'vue';

const store = useAppStore();
const game = computed(() => {
  return store.lobby?.game;
})
const currentRound = computed(() => {
  if (game.value) {
    return game.value.rounds[game.value.currentRound - 1];
  } else {
    return null;
  }
});
const currentOptions = computed(() => {
  return currentRound.value?.options ?? [];
})

const currentSong = computed(() => {
  return currentRound.value?.song ?? null;
});

const selectedIndex = computed(() => {
  let playerGuess = currentRound.value.playerGuesses.find(g => g.player.id === store.player.id);
  if (playerGuess) {
    return playerGuess.guess.index;
  }
  return null;
})

const secondsLeftInRound = computed(() => {
  const currentDate = new Date();
  if (currentRound.value) {
    if (currentRound.value.round_ended) {
      return 0;
    }
    const startedDate = new Date(currentRound.value.roundStartedAt);
    const differenceInSeconds = Math.floor((currentDate - startedDate) / 1000);
    const secondsLeft = 30 - differenceInSeconds;
    return secondsLeft > 0 ? secondsLeft : 0;
  }
  return null;
})

function selectOption(index) {
  store.selectOption(index);
  selectedIndex.value = index;
}



watch(() => currentSong.value, (newVal) => {
  // store.audio = new Audio('http://159.89.96.65/music/' + newVal);

  // store.audio.play().then(() => {
  //   console.log('Playback started successfully');
  // }).catch(error => {
  //   console.error('Error occurred during playback:', error);
  // });
});

onUnmounted(() => {
  store.audio.pause();
  store.audio = null;
})

onMounted(() => {
  // Start the music if joined late
  if (currentRound.value) {
    const startedDate = new Date(currentRound.value.roundStartedAt);
    const timeDifferenceInSeconds = (new Date() - startedDate) / 1000;
    store.audio = new Audio('http://159.89.96.65/music/' + currentRound.value.song);
    store.audio.addEventListener('loadedmetadata', () => {
      console.log('currentRound', store.audio.duration, timeDifferenceInSeconds);
      if (timeDifferenceInSeconds >= 0 && timeDifferenceInSeconds <= store.audio.duration) {
        store.audio.currentTime = timeDifferenceInSeconds;
        store.audio.play();
      }
    });
  }
})

</script>

<style>

.options {
  width: 100%;
  height: 100%;
  justify-content: center;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 20px;
  flex-grow: 1;
}

.option {
  padding: 20px;
  width: 300px;
}

.game-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.round-header {
  text-align: center;
  /* padding: 30px; */
  padding-bottom: 30px;
  position: relative;
}

.seconds-left {
  position: absolute;
  top: 0px;
  right: -150px;
  border-radius: 8px;
  /* width: 30px; */
  /* height: 30px; */
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.disabled {
}

.selected {
  background-color: #2196F3;
  color: white;
}

.correct-choice {
  background-color: #4CAF50;
  color: white !important;
}

.correct {
  color: #4CAF50;
}

.wrong-choice {
  background-color: #F44336;
  color: white;
}

.song-container {
  height: 60px;
}

.song-name {
  font-size: 30px;
}

.players-container {
    width: 300px;
    padding: 10px 20px;
    position: absolute;
    top: 50px;
    right: 50px;
  }

  .player-name {
    padding: 5px 0;
    font-size: 16px;
    display: flex;
    justify-content: space-between;
  }

@media (max-width: 1199px) {
  .seconds-left {
    right: -100px;
  }

  .song-name {
    font-size: 20px;
    text-align: center;
  }
}
</style>
