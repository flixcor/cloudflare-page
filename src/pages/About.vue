<template>
  <h1>{{ msg }}</h1>
  <template v-if="data">
  api: {{ data  }}
  </template>
</template>

<script setup lang="ts">
import type { ApiData } from '../types'
const msg = 'about'
const data = await fetch('/apidata').then((r) => r.json<ApiData>()).catch(() => {})
</script>

<style scoped>
h1 {
  color: red;
}
</style>
