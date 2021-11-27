import { parseURL } from "ufo"
import { createRenderer } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'

const decoder = new TextDecoder()
class CommentHandler implements HTMLRewriterDocumentContentHandlers {
    constructor(private preloadLinks: string, private html: ReadableStream | (() => Promise<string>)){}
    async comments(comment: Comment) {
        if(comment.text.includes('preload')){
            comment.replace(this.preloadLinks, {
                html: true
            })
        } else if (comment.text.includes('html')) {
            if(typeof this.html === 'function') {
                comment.replace(await this.html(), { html: true })
                return
            }
            comment.replace(this.html, {html: true})
            // const reader = this.html.getReader()
            // let str = ''
            // while(true) {
            //     const {done, value} = await reader.read()
            //     if(value) {
            //         str += decoder.decode(value)
            //     }
            //     if(done) {
            //         comment.replace(str, { html: true })
            //         return
            //     }
            // }
        }
    }
}

const ssr: PagesFunction = async ({request, next}) => {
    try {
        const response = await next(request)
        if(!response.headers.get('content-type')?.includes('text/html')){
            return response
        }
        const { pathname } = parseURL(request.url)
        const { preloadLinks, renderToWebStream } = await createRenderer(pathname, manifest)
        // const {readable, writable} = new TransformStream()
        // pipeToWebWritable(writable) 
        //
        const handler = new CommentHandler(preloadLinks, renderToWebStream())
        return new HTMLRewriter()
            .onDocument(handler)
            .transform(response)
    } catch (error) {
        return new Response(JSON.stringify({
            error, request, next
        }))
    }
}

export const onRequest = [ssr] as const
