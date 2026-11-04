import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const outputDir = 'C:\\Users\\M.Karami\\.gemini\\antigravity\\brain\\6e653027-908c-41a1-8806-4310ed97fcee\\screenshots'

// Simple static server for dist
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0]
  if (reqPath === '/' || !path.extname(reqPath)) {
    reqPath = '/index.html'
  }
  const filePath = path.join(distDir, reqPath)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  } else {
    // SPA fallback
    const indexHtml = path.join(distDir, 'index.html')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    fs.createReadStream(indexHtml).pipe(res)
  }
})

const PORT = 5199
server.listen(PORT, async () => {
  console.log(`Preview server running at http://localhost:${PORT}`)

  const viewports = [
    { width: 360, height: 640, label: '360x640' },
    { width: 390, height: 844, label: '390x844' },
    { width: 768, height: 1024, label: '768x1024' },
    { width: 1440, height: 900, label: '1440x900' },
  ]

  let browser
  try {
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    })

    const context = await browser.newContext({
      locale: 'fa-IR',
    })

    const page = await context.newPage()

    // 1. First visit to populate sample contacts in IndexedDB for visual testing
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`http://localhost:${PORT}/settings`, { waitUntil: 'networkidle' })

    // Generate benchmark/sample data
    console.log('Generating initial test contacts...')
    const benchBtn = page.locator('button:has-text("تولید ۵٬۰۰۰ فرد و ۱۰٬۰۰۰ رابطه")')
    if (await benchBtn.isVisible()) {
      await benchBtn.click()
      await page.waitForTimeout(4000)
    }

    // 2. Iterate through each viewport and capture screens + check overflow
    const testResults = []

    for (const vp of viewports) {
      console.log(`Testing viewport ${vp.label}...`)
      await page.setViewportSize({ width: vp.width, height: vp.height })

      // A) People Page
      await page.goto(`http://localhost:${PORT}/people`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(600)

      const peopleOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      const peopleImg = path.join(outputDir, `people-${vp.label}.png`)
      await page.screenshot({ path: peopleImg, fullPage: false })

      // B) Graph Page
      await page.goto(`http://localhost:${PORT}/graph`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1500)

      const graphOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      const graphImg = path.join(outputDir, `graph-${vp.label}.png`)
      await page.screenshot({ path: graphImg, fullPage: false })

      // C) Settings Page
      await page.goto(`http://localhost:${PORT}/settings`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(600)

      const settingsOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      const settingsImg = path.join(outputDir, `settings-${vp.label}.png`)
      await page.screenshot({ path: settingsImg, fullPage: false })

      testResults.push({
        viewport: vp.label,
        peopleOverflow,
        graphOverflow,
        settingsOverflow,
        passed: !peopleOverflow && !graphOverflow && !settingsOverflow,
      })
    }

    console.log('Viewport Test Results:', JSON.stringify(testResults, null, 2))
    fs.writeFileSync(
      path.join(outputDir, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    )

    await browser.close()
  } catch (err) {
    console.error('Test execution failed:', err)
  } finally {
    server.close()
  }
})
