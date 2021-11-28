<template>
<h1>About</h1>
<template v-if="apiData">
api: {{ apiData  }}
</template>
</template>

<script setup lang="ts">
import useFetch from '../composables/useFetch'
const apiData = await useFetch('/apidata')
</script>