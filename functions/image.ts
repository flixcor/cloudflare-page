const url = 'https://image.shutterstock.com/image-photo/graphs-representing-stock-market-crash-600w-1658501806.jpg'
export const onRequest: PagesFunction = async ({request}) => {
    const accept = request.headers.get('accept')
    const options: RequestInit | undefined = accept?.includes('image/avif')
        ? { cf: { image: { format: 'avif' } } }
        : undefined    
    const img = await fetch(url, options)
    img.headers.set('x-this-was-accepted', accept || 'undefined')
    return img
}