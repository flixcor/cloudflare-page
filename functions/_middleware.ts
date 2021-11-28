import { parseURL } from "ufo"
import { createRenderer } from "../dist/entry-server"
import manifest from '../dist/ssr-manifest.json'

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const appHtmlComment = `<!--app-html-->`
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
            // comment.replace(this.html, {html: true})
            const reader = this.html.getReader()
            let str = ''
            while(true) {
                const {done, value} = await reader.read()
                if(value) {
                    str += decoder.decode(value)
                }
                if(done) {
                    comment.replace(str, { html: true })
                    return
                }
            }
        }
    }
}

const ssr: PagesFunction = async ({request, next, waitUntil}) => {
    try {
        const response = await next(request)
        if(!response.headers.get('content-type')?.includes('text/html')){
            return response
        }
        const { pathname } = parseURL(request.url)
        const template = await response.text()
        const index = template.indexOf(appHtmlComment)
        const { preloadLinks, renderToSimpleStream } = await createRenderer(pathname, manifest)
        let before = template.substring(0, index).replace(`<!--preload-links-->`, preloadLinks)
        const after = template.substring(index + appHtmlComment.length)
        const {readable, writable} = new TransformStream()

        const writer = writable.getWriter()
        const write = (c: string) => writer.write(encoder.encode(c))
        const destroy = writer.close
        
        renderToSimpleStream({
            async push (content: string | null) {
                if(content === null) {
                    await write(after)
                    return destroy()
                }
                if(before) {
                    await write(before)
                    before = ''
                }
                return write(content)
            },
            destroy
        })


        return new Response(readable, response)
        
        // const handler = new CommentHandler(preloadLinks, readable)
        // return new HTMLRewriter()
        //     .onDocument(handler)
        //     .transform(response)
    } catch (error) {
        return new Response(JSON.stringify({
            error, request, next
        }))
    }
}

function toStream(before: string) {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(before))
            controller.close()
        },
    })
}

async function writeText(input: Array<string|((s: WritableStream) => void)>, writable: WritableStream) {
    let writer: WritableStreamDefaultWriter | null = null
    for (let index = 0; index < input.length; index++) {
        const element = input[index];
        if(typeof element === 'string') {
            if(!writer) {
                writer = writable.getWriter()
            }
            writer.write(encoder.encode(element))
        } else {
            if(writer) {
                await writer.close()
                writer = null
            }
            element(writable)
        }
    }
    if(writer) {
        await writer.close()
    }
    // await writable.close()
}

export const onRequest = [ssr] as const
