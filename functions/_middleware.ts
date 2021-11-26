import { parseURL } from "ufo"
import { createRenderer } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'
import template from '../dist/index.html'

const appMarker = `<!--app-html-->`
const preloadMarker = `<!--preload-links-->`

const appMarkerIndex = template.indexOf(appMarker)
const preloadMarkerIndex = template.indexOf(preloadMarker)

const start = template.substring(0, preloadMarkerIndex)
const between = template.substring(preloadMarkerIndex + preloadMarker.length, appMarkerIndex)
const end = template.substring(appMarkerIndex + appMarker.length)
new HTMLRewriter().on('head', )
class CommentHandler implements HTMLRewriterElementContentHandlers {
    constructor(private preloadLinks: string, private html: string){}
    comments(comment: Comment) {
        switch (comment.text) {
            case preloadMarker:
                comment.replace(this.preloadLinks)
                break;
            case appMarker:
                comment.replace(this.html)
            default:
                break;
        }
    }
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

async function handle(request: Request, response: Response) {
    if(!response.headers.get('content-type')?.includes('text/html')){
        return response
    }
    const { pathname } = parseURL(request.url)
    const [html, preloadLinks] = await createRenderer(pathname, manifest)
    const handler = new CommentHandler(preloadLinks, html)
    return new HTMLRewriter()
        .on('div#app, head', handler)
        .transform(response)
}

async function render(intermediateResponse: Response, path: string) {
    if(!intermediateResponse.headers.get('content-type')?.includes('text/html')){
        return intermediateResponse
    }

    const [html, preloadLinks] = await createRenderer(path, manifest)
    const all = [
        start,
        preloadLinks,
        between,
        html,
        end
    ]

    return new Response(all.join(), intermediateResponse)
}

async function writeStrings(writable: WritableStream<string>, strings: string[]) {
    const writer = writable.getWriter()
    strings.forEach(async (x) => {
        await writer.ready
        await writer.write(x)
    })
    await writer.ready
    await writer.close()
}