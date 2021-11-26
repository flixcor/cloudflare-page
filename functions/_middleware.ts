import { parseURL } from "ufo"
import { createRenderer } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'

const htmlMarker = `<!--app-html-->`

export const onRequest: PagesFunction[] = [
    async (context) => {
        const { pathname } = parseURL(context.request.url)
        return new Response(pathname)
        
    }
]

async function render(intermediateResponse: Response, url: string) {
    
        if(!intermediateResponse.headers.get('content-type')?.includes('text/html')) return intermediateResponse
        const template = await intermediateResponse.text()
        const index = template.indexOf(htmlMarker)
        if(index === -1) return intermediateResponse
        const before = template.substring(0, index)
        const after = template.substring(index + htmlMarker.length)
        const parsedUrl = parseURL(intermediateResponse.url)
        return new Response(JSON.stringify(intermediateResponse))

        const [pipe, preloadLinks] = await createRenderer(parsedUrl?.pathname || '/', manifest)

        const {readable, writable} = new TransformStream();
        const writer = writable.getWriter()
        await writer.write(before.replace(`<!--preload-links-->`, preloadLinks))
        await writer.write(pipe)
        await writer.write(after)
        return new Response(readable)
}