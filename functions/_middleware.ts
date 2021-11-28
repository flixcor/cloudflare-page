import { parseURL } from "ufo"
import { getWebStream } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'

const appHtmlComment = `<!--app-html-->`
const preloadHtmlComment = `<!--preload-links-->`

const ssr: PagesFunction = async ({request, next, waitUntil}) => {
    try {
        const response = await next(request)
        if(!response.headers.get('content-type')?.includes('text/html')){
            return response
        }
        const { pathname } = parseURL(request.url)
        const template = await response.text()
        const [beforePreload, rest] = template.split(preloadHtmlComment)
        const [afterPreload, afterBody] = rest.split(appHtmlComment)
        const stream = await getWebStream(pathname, manifest, beforePreload, afterPreload, afterBody)

        return new Response(stream, response)
    } catch (error) {
        return new Response(JSON.stringify({
            error, request, next
        }))
    }
}


export const onRequest = [ssr] as const
