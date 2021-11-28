import { useSSRContext } from "vue";

async function getJson<T>(url: string) {
    const response = await fetch(url)
    return response.json<T>()
}

export default async function useFetch<T>(url: string) {
    const context = useSSRContext()
    if(import.meta.env.SSR) {
        try {
            const json = getJson<T>(url)
            if(context) {
                context[url] = json
            }
            return json   
        } catch (error) {
            console.log(error)
        }
    }
    if(context && context[url]){
        const json = context[url]
        context[url] = null
        return json
    }
    return getJson<T>(url)
}