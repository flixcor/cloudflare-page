export const onRequest: PagesFunction[] = [
    async ({next, data}) => {
        const response = await next()
        response.headers.set('X-Hello', 'World')
        return response
    }
]