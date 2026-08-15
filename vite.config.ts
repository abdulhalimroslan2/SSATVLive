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
          res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
          res.setHeader('Access-Control-Allow-Headers', '*')
        }

        if (req.method === 'OPTIONS') {
          setCors(); res.writeHead(200); res.end(); return
        }

        // Special handler for okayru VOD (resolves redirect host and fixes BaseURL)
        if (url.startsWith('/ptv2026/okayru')) {
          setCors()
          const targetUrl = url.replace('/ptv2026/', 'https://ptv2026.com/')
          const curl = spawn('curl', ['-s', '-L', '-w', '\nEFFECTIVE_URL:%{url_effective}', targetUrl])
          let body = ''
          curl.stdout.on('data', (d) => { body += d.toString() })
          curl.on('close', () => {
            const parts = body.split('\nEFFECTIVE_URL:')
            let content = parts[0]
            const effectiveUrl = parts[1] ? parts[1].trim() : ''
            let host = 'https://ptv2026.com'
            try {
              if (effectiveUrl) {
                host = new URL(effectiveUrl).origin
              }
            } catch (_) {}

            if (url.includes('.mpd')) {
              res.setHeader('Content-Type', 'application/dash+xml')
              content = content.replace(/<BaseURL>\?/g, `<BaseURL>${host}/?`)
            } else if (url.includes('.m3u8')) {
              res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
              const baseUrl = effectiveUrl.substring(0, effectiveUrl.lastIndexOf('/') + 1)
              content = content.split('\n').map(line => {
                if (line.trim() && !line.startsWith('#') && !line.startsWith('http')) {
                  return baseUrl + line.trim()
                }
                return line
              }).join('\n')
            }
            res.end(content)
          })
          return
        }

        // All curl proxy targets
        const curlTargets: { prefix: string; target: string; args?: string[] }[] = [
          { prefix: '/astro-linear/', target: 'https://linearjitp-playback.astro.com.my/', args: ['-H', `User-Agent: ${ASTRO_UA}`] },
          { prefix: '/astro-vod/', target: 'https://vodejitp-asset-playback-b.astro.com.my/', args: ['-H', `User-Agent: ${ASTRO_UA}`] },
          { prefix: '/iris-synamedia/', target: 'https://vod-dai-ott-ap.ssai.iris.synamedia.com/', args: ['-H', `User-Agent: ${ASTRO_UA}`] },
          { prefix: '/ngtv-vod/', target: 'https://ngtv-vod.gcdn.co/' },
          { prefix: '/viu-vod/', target: 'https://dms-api.viu.com/' },
          { prefix: '/perfecttv/', target: 'https://get.perfecttv.net/' },
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

            if (req.method === 'POST') {
              const curl = spawn('curl', ['-s', '-L', '-X', 'POST', '-H', 'Content-Type: application/octet-stream', '--data-binary', '@-', ...(args || []), targetUrl])
              req.pipe(curl.stdin)
              curl.stdout.pipe(res)
              curl.on('error', () => { if (!res.headersSent) { res.writeHead(500); res.end() } })
              return
            }

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
    host: '0.0.0.0',
    port: 5173,
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
        target: 'https://tstgo.1000966.xyz',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/iptv-direct/, '')
      },
      '/yupptv': {
        target: 'https://yuppmedtast-vh.akamaihd.net',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/yupptv/, '')
      },
      '/stream-m3u8': {
        target: 'https://m3u8.stream263.com',
        changeOrigin: true, followRedirects: true,
        rewrite: (path) => path.replace(/^\/stream-m3u8/, '')
      }
    }
  }
})
