import { parseURL } from "ufo"
import { createRenderer } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'

class CommentHandler implements HTMLRewriterDocumentContentHandlers {
    constructor(private preloadLinks: string, private html: ReadableStream){}
    comments(comment: Comment) {
        if(comment.text.includes('preload')){
            comment.replace(this.preloadLinks, {
                html: true
            })
        } else if (comment.text.includes('html')) {
            comment.replace(this.html, {
                html: true
            })
        }
    }
}

async function handle(request: Request, response: Response) {
    if(!response.headers.get('content-type')?.includes('text/html')){
        return response
    }
    const { pathname } = parseURL(request.url)
    const [html, preloadLinks] = await createRenderer(pathname, manifest)

    const handler = new CommentHandler(preloadLinks, html)
    return new HTMLRewriter()
        .onDocument(handler)
        .transform(response)
}

export const onRequest: PagesFunction[] = [
    async (context) => {
        try {
            const response = await context.next(context.request)
            const result = await handle(context.request, response)
            return result
        } catch (error) {
            return new Response(JSON.stringify({
                error, context
            }))
        }
    }
]
