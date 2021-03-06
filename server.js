// @ts-check
const fs = require('fs')
const path = require('path')
const express = require('express')
const compression = require('compression')
const serveStatic = require('serve-static')
const manifest = require('./dist/ssr-manifest.json')
const resolve = (p) => path.resolve(__dirname, p)
const indexProd = fs.readFileSync(resolve('dist/index.html'), 'utf-8')

async function createServer() {
  const app = express()

  app.use(compression())
  app.use(
    serveStatic(resolve('dist'), {
      index: false
    })
  )

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      const template = indexProd
      const createRenderer = require('./dist/entry-server.js').createRenderer

      const {renderToString, preloadLinks} = await createRenderer(url, manifest)

      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--app-html-->`, await renderToString())

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app }
}

createServer().then(({ app }) =>
    app.listen(3000, () => {
      console.log('http://localhost:3000')
    })
  )
