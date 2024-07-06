<template>
  <div id="app">
    <router-view v-if="isRouterAlive" />
  </div>
</template>

<style>
#app {
}
</style>
<script setup lang="ts">
import { nextTick, provide, ref } from "vue";

const isRouterAlive = ref(true);
const reload = () => {
  isRouterAlive.value = false;
  nextTick(() => {
    isRouterAlive.value = true;
  });
};

provide("reload", reload);
</script>
