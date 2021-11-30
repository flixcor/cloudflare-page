import { createApp } from './main'
import type { SSRContext } from '@vue/server-renderer'
import { renderToSimpleStream } from '@vue/server-renderer'

type Manifest = Record<string, string[]>

const encoder = new TextEncoder()
const decoder = new TextDecoder("utf-8")

export async function getWebStream<P extends string,A extends string>(url: string, manifest: Manifest, htmlStream: ReadableStream, preloadLinkComment: HtmlComment<P>, appBodyComment: HtmlComment<A>): Promise<ReadableStream> {
    const { app, router } = createApp()

    // set the router to the desired URL before rendering
    router.push(url)
    await router.isReady()
    // passing SSR context object which will be available via useSSRContext()
    // @vitejs/plugin-vue injects code into a component's setup() that registers
    // itself on ctx.modules. After the render, ctx.modules would contain all the
    // components that have been instantiated during this render call.
    const ctx: SSRContext = {}
    const { writable, readable } = new TransformStream()
    const writer = writable.getWriter()
    const reader = htmlStream.getReader()
    
    const write = (c: string) => writer.write(encoder.encode(c))
    let initialized = false

    async function close() {
        await write(`<span id="context">${JSON.stringify(ctx)}</context>`)
        await pipe(reader, writer)
        await writer.close()
    }

    await pipeUntilText(reader, writer, preloadLinkComment)

    renderToSimpleStream(app, ctx, {
        push (content: string | null) {
            if(content === null) {
                return close()
            }
            if(!initialized) {
                initialized = true
                write(renderPreloadLinks(ctx.modules || [], manifest))
                pipeUntilText(reader, writer, appBodyComment)
            }
            write(content)
        },
        destroy() {
            writer.close()
        }
    })

    return readable
}

function renderPreloadLinks(modules: string[], manifest: Manifest) {
    let links = ''
    const seen = new Set()
    modules.forEach((id) => {
        const files = manifest[id]
        if (files) {
            files.forEach((file) => {
                if (!seen.has(file)) {
                    seen.add(file)
                    links += renderPreloadLink(file)
                }
            })
        }
    })
    return links
}

function renderPreloadLink(file: string) {
    if (file.endsWith('.js')) {
        return `<link rel="modulepreload" crossorigin href="${file}">`
    } else if (file.endsWith('.css')) {
        return `<link rel="stylesheet" href="${file}">`
    } else if (file.endsWith('.woff')) {
        return ` <link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`
    } else if (file.endsWith('.woff2')) {
        return ` <link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`
    } else if (file.endsWith('.gif')) {
        return ` <link rel="preload" href="${file}" as="image" type="image/gif">`
    } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        return ` <link rel="preload" href="${file}" as="image" type="image/jpeg">`
    } else if (file.endsWith('.png')) {
        return ` <link rel="preload" href="${file}" as="image" type="image/png">`
    } else {
        // TODO
        return ''
    }
}

type HtmlComment<T extends string> = `<!--${T}-->`

async function pipe(
    reader: ReadableStreamDefaultReader, 
    writer: WritableStreamDefaultWriter,
){
    let done = false
    while(!done) {
        const res = await reader.read()
        done = res.done
        if(res.value) {
            writer.write(res.value)
        }
    }
}

async function pipeUntilText(
    reader: ReadableStreamDefaultReader, 
    writer: WritableStreamDefaultWriter,
    text: string) {
    const length = text.length
    if(length == 0) return
    const firstChar = text[0]
    let buffer = ''
    let firstCharIndex = -1
    let done = false

    while(!done) {
        while(!done && (firstCharIndex < 0 || buffer.length - firstCharIndex < length)) {
            const res = await reader.read()
            done = res.done
            if(!res.value) continue
            buffer += decoder.decode(res.value, {stream: true})
            firstCharIndex = buffer.indexOf(firstChar)
        }
        const [before, after] = buffer.split(firstChar)
        writer.write(encoder.encode(before))
        const fixed = firstChar + after
        if(fixed === text) return
        writer.write(encoder.encode(fixed))
        buffer = ''
    }
}
