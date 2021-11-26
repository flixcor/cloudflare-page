import { createRenderer } from "../src/entry-server"
import manifest from '../dist/ssr-manifest.json'
const htmlMarker = `<!--app-html-->`

export const onRequest: PagesFunction[] = [
    async ({next}) => {
        const intermediateResponse = await next()
        if(!intermediateResponse.headers.get('content-type')?.includes('text/html')) return intermediateResponse
        const template = await intermediateResponse.text()
        const index = template.indexOf(htmlMarker)
        if(index === -1) return intermediateResponse
        const before = template.substring(0, index)
        const after = template.substring(index + htmlMarker.length)
        const [pipe, preloadLinks] = await createRenderer(intermediateResponse.url, manifest)

        const {readable, writable} = new TransformStream();
        const writer = writable.getWriter()
        await writer.write(before.replace(`<!--preload-links-->`, preloadLinks))
        pipe(writable)
        try {
            await writer.ready    
        } catch (error) {
            console.log(error)
        }
        
        await writer.write(after)
        return new Response(readable)
    }
]