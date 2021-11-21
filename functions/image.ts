import { jsonResponse } from "./utilities"

const url = 'https://image.shutterstock.com/image-photo/graphs-representing-stock-market-crash-600w-1658501806.jpg'
export const onRequest: PagesFunction = async ({request}) => {
    // const accept = request.headers.get('accept')
    // const options: RequestInit | undefined = accept?.includes('image/avif')
    //         ? undefined // ? { cf: { image: { format: 'avif' } } }
    //         : undefined
    try {
        const img = await fetch(url)
        // img.headers.set('x-this-was-accepted', accept || 'undefined')
        return img
    } catch (error) {
        return new Response(JSON.stringify(error), { status: 500 })
    }
}