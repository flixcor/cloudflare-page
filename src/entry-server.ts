import { createApp } from './main'
import type { SSRContext } from '@vue/server-renderer'
import { renderToSimpleStream } from '@vue/server-renderer'
import { resolveComponent } from '@vue/runtime-core'

type Manifest = Record<string, string[]>

const encoder = new TextEncoder()
const decoder = new TextDecoder()

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
        await writeToEnd(reader, writer)
        await writer.close()
    }

    renderToSimpleStream(app, ctx, {
        push (content: string | null) {
            if(content === null) {
                return close()
            }
            if(!initialized) {
                initialized = true
                writeUntilComment(reader, writer, preloadLinkComment)
                write(renderPreloadLinks(ctx.modules || [], manifest))
                writeUntilComment(reader, writer, appBodyComment)
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

const openingTag = '<' as const
type OpeningTag = typeof openingTag
type HtmlComment<T extends string> = `${OpeningTag}!--${T}-->`

async function writeToEnd(
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

async function writeUntilComment<T extends string>(
    reader: ReadableStreamDefaultReader, 
    writer: WritableStreamDefaultWriter,
    comment: HtmlComment<T>) {
    const length = comment.length
    let buffer = ''
    let firstCharIndex = -1
    let done = false

    while(!done) {
        while(!done && (firstCharIndex < 0 || buffer.length - firstCharIndex < length)) {
            const res = await reader.read()
            done = res.done
            if(!res.value) continue
            buffer += decoder.decode(res.value)
            firstCharIndex = buffer.indexOf(openingTag)
        }
        const [before, after] = buffer.split(openingTag)
        writer.write(encoder.encode(before))
        const fixed = openingTag + after
        if(fixed === comment) return
        writer.write(encoder.encode(fixed))
        buffer = ''
    }
}
