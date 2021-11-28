import { useSSRContext } from "vue";

async function getJson<T>(url: string) {
    const response = await fetch(url)
    return response.json<T>()
}

function getFromContext<T>(key: string): T | undefined {
    const el = document.getElementById('context')
    const ctx = JSON.parse(el?.textContent || '{}')
    return ctx[key] as T | undefined
}

export default async function useFetch<T = any>(url: string): Promise<T | undefined> {
    const context = useSSRContext()
    if(import.meta.env.SSR) {
        try {
            const json = await getJson<T>(url)
            if(context) {
                context[url] = json
            }
            return json   
        } catch (error) {
            console.log(error)
            return
        }
    }
    return getFromContext<T>(url) || getJson<T>(url)
}