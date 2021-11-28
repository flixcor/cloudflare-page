<script setup lang="ts">
import {  ref } from 'vue';
import useLazyResizedImage from '../composables/useLazyResizedImage';

// const data = await fetch('/apidata').then((r) => r.json<ApiData>()).catch(() => {})
defineProps<{ msg?: string }>()

const count = ref(0)
const imgRef = ref<HTMLElement | null>(null)
const { url, loading } = useLazyResizedImage(imgRef, '/media/highres.jpg')
</script>

<template>
  <h1>{{ msg }}</h1>
  <!-- <template v-if="data">
  api: {{ data  }}
  </template> -->
  <p>
    Recommended IDE setup:
    <a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
    +
    <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
  </p>
  <p>See <code>README.md</code> for more information.</p>
  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">
      Vite Docs
    </a>
    |
    <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Docs</a>
  </p>
  <button type="button" @click="count++">count is: {{ count }}</button>
  <p>
    Edit
    <code>components/HelloWorld.vue</code> to test hot module replacement.
  </p>
  <img ref="imgRef" :class="{ loading }" :src="url" alt="highres">
</template>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}

img {
  width: 100%;
  height: 500px;
  display: block;
  opacity: 100%;
  transition: opacity 250ms ease-in;
}

img.loading {
  opacity: 0;    
}
</style>
