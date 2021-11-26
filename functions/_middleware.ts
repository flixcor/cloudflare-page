import { parseURL } from "ufo"
import { createRenderer } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'

const htmlMarker = `<!--app-html-->`

export const onRequest: PagesFunction[] = [
    async (context) => {
        const { pathname } = parseURL(context.request.url)
        const response = await context.next(context.request)
        return render(response, pathname)
    }
]

async function render(intermediateResponse: Response, path: string) {
    
        if(!intermediateResponse.headers.get('content-type')?.includes('text/html')) return intermediateResponse
        const template = await intermediateResponse.text()
        const index = template.indexOf(htmlMarker)
        if(index === -1) return intermediateResponse
        const before = template.substring(0, index)
        const after = template.substring(index + htmlMarker.length)

        const [pipe, preloadLinks] = await createRenderer(path, manifest)

        const all = before.replace(`<!--preload-links-->`, preloadLinks)
            + pipe
            + after 

        return new Response(all, intermediateResponse)
}