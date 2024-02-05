<template>
  <template v-if="store.lobby">
    <div
      v-if="!store.lobby.game"
      class="main"
    >
      <v-card
        class="code-container"
        elevation="10"
      >
        {{ store.lobby.code }}
      </v-card>

      <v-card
        elevation="2"
        class="players-container"
        :title="'Players (' + store.lobby.players.length + ')'"
      >
        <div
          class="player-name"
          :class="{ disconnected: player.state === 0 }"
          v-for="(player, index) in store.lobby.players"
          :key="index"
        >
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
      </v-card>

      <v-btn
        id="start-btn"
        color="primary"
        size="large"
        @click="startGame()"
      >Start the game</v-btn>
    </div>

    <Game v-else>

    </Game>

  </template>
  <v-dialog v-model="dialog" width="300px" persistent>
    <v-card>
      <v-btn color="primary" @click="joinLobby()" size="large">
        Join game
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>

import { useAppStore } from '@/store/app';
import { useRouter, useRoute } from 'vue-router';
import Game from '@/views/Game.vue';
import { ref } from 'vue';

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const code = ref(null);
const dialog = ref(false);
if (!store.lobby) {
  code.value = Array.isArray(route.params.code)
    ? route.params.code[0]
    : route.params.code;

  if (code.value) {
    dialog.value = true;
  } else {
    router.push({
      name: 'Home'
    });
  }
}

function joinLobby() {
  store.joinLobby(parseInt(code.value));
  dialog.value = false;
}

function startGame() {
  store.startGame();
}

</script>

<style scoped>
  .main {
    height: 100%;
    display: flex;
    /* justify-content: center; */
    align-items: center;
    flex-direction: column;
  }

  .code-container {
    width: 400px;
    height: 100px;
    margin-top: 200px;
    line-height: 100px;
    text-align: center;
    font-size: 50px;
    font-weight: 600;
  }

  .players-container {
    width: 400px;
    padding: 10px 20px;
    margin-top: 150px;
  }

  .player-name {
    padding: 5px 0;
    font-size: 16px;
  }

  #start-btn {
    position: absolute;
    bottom: 100px;
  }

  .player-name.disconnected {
    color: #8a8a8a;
  }
</style>
