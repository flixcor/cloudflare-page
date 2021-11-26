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



export const onRequest: PagesFunction[] = [
    async (context) => {
        const { pathname } = parseURL(context.request.url)
        const response = await context.next(context.request)
        return render(response, pathname)
    }
]

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