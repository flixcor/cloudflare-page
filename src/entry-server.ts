import { createApp } from './main'
import type { SSRContext } from '@vue/server-renderer'
import { renderToSimpleStream } from '@vue/server-renderer'

type Manifest = Record<string, string[]>

export async function getWebStream(url: string, manifest: Manifest, beforePreload: string, afterPreload: string, afterBody: string): Promise<ReadableStream> {
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
    const encoder = new TextEncoder()
    const write = (c: string) => writer.write(encoder.encode(c))
    let initialized = false

    async function close() {
        await write(afterBody)
        await writer.close()
    }

    renderToSimpleStream(app, ctx, {
        push (content: string | null) {
            if(content === null) {
                return close()
            }
            if(!initialized) {
                initialized = true
                write(beforePreload)
                write(renderPreloadLinks(ctx.modules || [], manifest))
                write(afterPreload)
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

async function pipeToWeb(url: string, manifest: Manifest, stream: WritableStream, beforePreload: string, afterPreload: string, afterBody: string) {

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
