import { createRenderer } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'
const htmlMarker = `<!--app-html-->`

export const onRequest: PagesFunction[] = [
    async ({next, request}) => {
        try {
            return render(await next(request), request.url)
        } catch (error) {
            console.log(error)
            if(typeof error === 'string') return new Response(error)
            return new Response(JSON.stringify(error))            
        }
        
    }
]

async function render(intermediateResponse: Response, url: string) {
    
        if(!intermediateResponse.headers.get('content-type')?.includes('text/html')) return intermediateResponse
        const template = await intermediateResponse.text()
        const index = template.indexOf(htmlMarker)
        if(index === -1) return intermediateResponse
        return new Response(url)
        const before = template.substring(0, index)
        const after = template.substring(index + htmlMarker.length)
        const { pathname } = new URL(intermediateResponse.url)
        
        try {
            const [pipe, preloadLinks] = await createRenderer(pathname, manifest)
            return new Response(preloadLinks, intermediateResponse)    
        } catch (error) {
            if(!error) return new Response('throw without error')
            return new Response(JSON.stringify(error))
        }

        

        // const {readable, writable} = new TransformStream();
        // const writer = writable.getWriter()
        // await writer.write(before.replace(`<!--preload-links-->`, preloadLinks))
        // pipe(writable)
        // try {
        //     await writer.ready    
        // } catch (error) {
        //     console.log(error)
        // }
        
        // await writer.write(after)
        // return new Response(readable)
}