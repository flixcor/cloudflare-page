import type { Ref } from 'vue';
import { useResizeObserver, useIntersectionObserver } from '@vueuse/core'
import { ref, computed } from 'vue';
import transparent from '../assets/transparent.gif'
export default function useLazyResizedImage(el: Ref<HTMLElement | null>, url: string) {
    const widthRef = ref(0)
    const heightRef = ref(0)
    const isVisible = ref(false)
    
    useResizeObserver(el, ([{ contentRect: {width, height} }]) => {
        widthRef.value = width
        heightRef.value = height
    })

    const {stop} = useIntersectionObserver(el, ([{isIntersecting}]) => {
        if(isIntersecting) {
            isVisible.value = true
            stop()
        }
    })

    return computed(() => getUrl(url, widthRef.value, heightRef.value, isVisible.value))
}

function getUrl(url: string, width: number, height: number, isVisible: boolean) {
    return isVisible && width && height
        ? `${url}?fit=crop&height=${height}&width=${width}`
        : transparent
}