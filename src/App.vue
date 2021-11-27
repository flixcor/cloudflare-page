<template>
  <div>
    <img class="dp-b" alt="Vue logo" src="./assets/logo.png" />
    <hello-world msg="Home" />
  </div>
</template>

<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
nav {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
