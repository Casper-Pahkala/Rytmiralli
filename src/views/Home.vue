<template>
  <div class="main">
    <v-btn
      color="primary"
      class="main-btn"
      @click="createLobby()"

    >Create lobby</v-btn>

    <v-btn class="main-btn" color="grey-darken-3" @click="openDialog">Join lobby</v-btn>

    <v-dialog v-model="dialog" width="400px">
      <v-card class="pa-5">
        <v-card-title>Enter code</v-card-title>

        <v-text-field
          v-model="code"
          @keyup.enter="joinLobby"
          type="number"
        ></v-text-field>

        <v-card-actions>
          <v-btn :disabled="code.length !== 6" @click="joinLobby" color="primary">Join</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
  import { useAppStore } from '@/store/app';
  import { ref } from 'vue'
  const store = useAppStore();
  const code = ref('');
  const dialog = ref(false);
  function createLobby() {
    store.createLobby();
  }

  function openDialog() {
    dialog.value = true;
  }
  function joinLobby() {
    store.joinLobby(parseInt(code.value));
  }
</script>

<style scoped>

  .main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    flex-direction: column;
    gap: 40px;
  }

  .main-btn {
    width: 300px;
    height: 50px;
  }
</style>
