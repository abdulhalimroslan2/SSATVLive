import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import { IncomingMessage, ServerResponse } from 'http'

const ASTRO_UA = 'Mozilla/5.0 (Linux; Android 10; MiTV-AXSO0 Build/QTZCS200912.005) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36'

function proxyPlugin() {
  return {
    name: 'curl-proxy',
    configureServer(server: any) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: Function) => {
        const url = req.url || ''

        const setCors = () => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', '*')
        }

        if (req.method === 'OPTIONS') {
          setCors(); res.writeHead(200); res.end(); return
        }

        // All curl proxy targets
        const curlTargets: { prefix: string; target: string; args?: string[] }[] = [
          { prefix: '/astro-linear/', target: 'https://linearjitp-playback.astro.com.my/', args: ['-H', `User-Agent: ${ASTRO_UA}`] },
          { prefix: '/cf-d2xz/', target: 'https://d2xz2v5wuvgur6.cloudfront.net/' },
          { prefix: '/cf-d2tj/', target: 'https://d2tjypxxy769fn.cloudfront.net/' },
          { prefix: '/cf-d84q/', target: 'https://d84q7nw4qf3j3.cloudfront.net/' },
          { prefix: '/cf-d3b0/', target: 'https://d3b0v7fggu5zwm.cloudfront.net/' },
          { prefix: '/mana2/', target: 'https://slive.mana2.my/' },
          { prefix: '/ptv2026/', target: 'https://ptv2026.com/' },
          { prefix: '/load-ptv/', target: 'https://load.ptv2026.com/' },
          { prefix: '/rtm-stream/', target: 'https://d25tgymtnqzu8s.cloudfront.net/', args: [
            '-H', 'Origin: https://rtmklik.rtm.gov.my', '-H', 'Referer: https://rtmklik.rtm.gov.my/'
          ]},
        ]

        for (const { prefix, target, args } of curlTargets) {
          if (url.startsWith(prefix)) {
            setCors()
            const targetUrl = url.replace(prefix, target)

            // Content-Type
            if (url.includes('.mpd')) res.setHeader('Content-Type', 'application/dash+xml')
            else if (url.includes('.m3u8')) res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
            else if (url.includes('.ts')) res.setHeader('Content-Type', 'video/mp2t')
            else if (/\.(m4f|m4s|m4v|m4a|mp4)/.test(url)) res.setHeader('Content-Type', 'video/mp4')

            const curl = spawn('curl', ['-s', '-L', ...(args || []), targetUrl])
            curl.stdout.pipe(res)
            curl.on('error', () => { if (!res.headersSent) { res.writeHead(500); res.end() } })
            return
          }
        }

        next()
      })
    }
  }
}

function corsPlugin() {
  return {
    name: 'cors-plugin',
    configureServer(server: any) {
      server.middlewares.use((_req: IncomingMessage, res: ServerResponse, next: Function) => {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
        res.setHeader('Access-Control-Allow-Headers', '*')
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), corsPlugin(), proxyPlugin()],
  server: {
    cors: true,
    proxy: {
      '/mediatailor-us': {
        target: 'https://a28dc5e3f24c4a8da3a67c68be729c2c.mediatailor.us-west-2.amazonaws.com',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/mediatailor-us/, '')
      },
      '/mediatailor-ap': {
        target: 'https://1938ecee77d844ba8727487421f36e44.mediatailor.ap-southeast-1.amazonaws.com',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/mediatailor-ap/, '')
      },
      '/cf-df14': {
        target: 'https://df14pcdp16s98.cloudfront.net',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/cf-df14/, '')
      },
      '/iptv-direct': {
        target: 'http://103.107.198.46:8080',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/iptv-direct/, '')
      },
      '/perfecttv': {
        target: 'https://get.perfecttv.net',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/perfecttv/, '')
      },
      '/gcdn': {
        target: 'http://ngtv-live-cbj.gcdn.co',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/gcdn/, '')
      },
      '/gcdn-s': {
        target: 'https://ngtv-live-cbj.gcdn.co',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/gcdn-s/, '')
      }
    }
  }
})
