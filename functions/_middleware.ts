import { parseURL } from "ufo"
import { createRenderer } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'

const decoder = new TextDecoder()
class CommentHandler implements HTMLRewriterDocumentContentHandlers {
    constructor(private preloadLinks: string, private html: ReadableStream){}
    async comments(comment: Comment) {
        if(comment.text.includes('preload')){
            comment.replace(this.preloadLinks, {
                html: true
            })
        } else if (comment.text.includes('html')) {
            comment.remove()
            const reader = this.html.getReader()
            while(true) {
                const {done, value} = await reader.read()
                if(value) {
                    comment.after(decoder.decode(value))
                }
                if(done) return
            }
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
        const [render, preloadLinks] = await createRenderer(pathname, manifest)
        const {readable, writable} = new TransformStream()
        render(writable)
        return new Response(readable)
        const handler = new CommentHandler(preloadLinks, readable)
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
