import { jsonResponse } from "./utilities"

const imageUrl = 'https://image.shutterstock.com/image-photo/graphs-representing-stock-market-crash-600w-1658501806.jpg'
export const onRequest: PagesFunction = async ({request}) => {
    // const accept = request.headers.get('accept')
    // const options: RequestInit | undefined = accept?.includes('image/avif')
    //         ? undefined // ? { cf: { image: { format: 'avif' } } }
    //         : undefined
    try {
        let url = new URL(request.url)

        // Cloudflare-specific options are in the cf object.
        const options: any= { cf: { image: {} } }

        // Copy parameters from query string to request options.
        // You can implement various different parameters here.
        if (url.searchParams.has("fit")) options.cf.image.fit = url.searchParams.get("fit")
        if (url.searchParams.has("width")) options.cf.image.width = url.searchParams.get("width")
        if (url.searchParams.has("height")) options.cf.image.height = url.searchParams.get("height")
        if (url.searchParams.has("quality")) options.cf.image.quality = url.searchParams.get("quality")

        // Your Worker is responsible for automatic format negotiation. Check the Accept header.
        const accept = request.headers.get("Accept");
        if (accept && /image\/avif/.test(accept)) {
            options.cf.image.format = 'avif';
        } else if (accept && /image\/webp/.test(accept)) {
            options.cf.image.format = 'webp';
        }
        const img = await fetch(imageUrl, options)
        const varies = img.headers.get('Vary')
        const newVary = [varies,'Accept'].filter(x=> x).join(', ')
        img.headers.set('Vary', newVary)
        // img.headers.set('x-this-was-accepted', accept || 'undefined')
        return img
    } catch (error) {
        return new Response(JSON.stringify(error), { status: 500 })
    }
}