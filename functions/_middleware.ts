import { parseURL } from "ufo"
import { getWebStream } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'

const appHtmlComment = `<!--app-html-->`
const preloadHtmlComment = `<!--preload-links-->`

const ssr: PagesFunction = async ({request, next}) => {
    try {
        const response = await next(request)
        if(!response.body || !response.headers.get('content-type')?.includes('text/html')){
            return response
        }

        const { pathname } = parseURL(request.url)
        const stream = await getWebStream(pathname, manifest, response.body, preloadHtmlComment, appHtmlComment)

        return new Response(stream, response)
    } catch (error) {
        return new Response(JSON.stringify({
            error
        }))
    }
}


export const onRequest = [ssr] as const
