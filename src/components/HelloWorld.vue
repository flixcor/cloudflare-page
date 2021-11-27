<script setup lang="ts">
import {  ref } from 'vue';
import { useResizeObserver } from '@vueuse/core'
import { ApiData } from '../types'

// const data = await fetch('/apidata').then((r) => r.json<ApiData>()).catch(() => {})
defineProps<{ msg?: string }>()

const count = ref(0)
const imgRef = ref<HTMLElement | null>(null)
const imgUrl = ref('/media/highres.jpg')
useResizeObserver(imgRef, ([{ contentRect: {width, height} }]) => {
  imgUrl.value = `/media/highres.jpg?fit=crop&height=${height}&width=${width}`
})
</script>

<template>
  <div>
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
    <img ref="imgRef" :src="imgUrl" alt="highres">
  </div>
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
}
</style>
