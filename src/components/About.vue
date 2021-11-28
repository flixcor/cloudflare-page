<template>
<h1>About</h1>
<template v-if="apiData">
api: {{ apiData  }}
</template>
</template>

<script setup lang="ts">
import useFetch from '../composables/useFetch'
type ToDo = {
    userId: number,
    id: number,
    title: string,
    completed: boolean
}
const apiData = await useFetch<ToDo>('https://jsonplaceholder.typicode.com/todos/1')
</script>