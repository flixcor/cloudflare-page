import { createApp } from './main'
import type { SSRContext } from '@vue/server-renderer'
import { renderToSimpleStream } from '@vue/server-renderer'

type Manifest = Record<string, string[]>

const {decode} = new TextDecoder()
const {encode} = new TextEncoder()

export async function getWebStream<P extends string,A extends string>(url: string, manifest: Manifest, htmlStream: ReadableStream<Uint8Array>, preloadLinkComment: HtmlComment<P>, appBodyComment: HtmlComment<A>): Promise<ReadableStream<Uint8Array>> {
    const { app, router } = createApp()

    // set the router to the desired URL before rendering
    router.push(url)
    await router.isReady()
    // passing SSR context object which will be available via useSSRContext()
    // @vitejs/plugin-vue injects code into a component's setup() that registers
    // itself on ctx.modules. After the render, ctx.modules would contain all the
    // components that have been instantiated during this render call.
    const ctx: SSRContext = {}
    const { writable, readable } = new TransformStream<Uint8Array,Uint8Array>()
    const writer = writable.getWriter()
    const reader = htmlStream.getReader()
    
    let initialized = false

    // async function close() {
    //     await writer.write(`<span id="context">${JSON.stringify(ctx)}</context>`)
    //     await pipe(reader, writer)
    //     await writer.close()
    // }

    await pipeUntilText(reader, writer, preloadLinkComment)

    // await pipeUntilText(reader, writer, preloadLinkComment)

    renderToSimpleStream(app, ctx, {
        push (content: string | null) {
            if(content === null) {
                return close()
            }
            if(!initialized) {
                initialized = true
                writer.write(encode(renderPreloadLinks(ctx.modules || [], manifest)))
                pipeUntilText(reader, writer, appBodyComment)
            }
            writer.write(encode(content))
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
    reader: ReadableStreamDefaultReader<Uint8Array>, 
    writer: WritableStreamDefaultWriter<Uint8Array>,
){
    let done = false
    while(!done) {
        const res = await reader.read()
        done = res.done
        if(res.value) {
            writer.write(encode(decode(res.value)))
        }
    }
}

async function pipeUntilText<T extends string>(
    reader: ReadableStreamDefaultReader<Uint8Array>, 
    writer: WritableStreamDefaultWriter<Uint8Array>,
    text: HtmlComment<T>) {
    const length = text.length
    const firstChar = '<'
    let buffer = ''
    let done = false

    while(!done) {
        const res = await reader.read()
        done = res.done
        if(!res.value) continue
        buffer += decode(res.value)
        if(buffer.indexOf(firstChar) === -1) {
            writer.write(encode(buffer))
            buffer = ''
            continue
        }
        if(buffer.length !== length) continue
        if(buffer === text) return
        
        const [_, first, ...rest] = buffer.split(firstChar)
        writer.write(encode(firstChar + first))
        buffer = rest.length ? firstChar + rest.join(firstChar) : ''
    }
}
