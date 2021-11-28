import type { Ref } from 'vue';
import { useResizeObserver, useIntersectionObserver } from '@vueuse/core'
import { ref, computed, watch } from 'vue';
const transparent = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

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

    const loading = ref(true)

    const newUrl = computed(() => getUrl(url, widthRef.value, heightRef.value, isVisible.value))

    function onLoad() {
        loading.value = newUrl.value === transparent
    }

    const disp = watch(el, (element) => {
        if(!element) return
        element.addEventListener('load', onLoad)
        disp()
    })

    return {
        loading,
        url: newUrl
    }
}

function getUrl(url: string, width: number, height: number, isVisible: boolean) {
    return isVisible && width && height
        ? `${url}?fit=crop&height=${height}&width=${width}`
        : transparent
}