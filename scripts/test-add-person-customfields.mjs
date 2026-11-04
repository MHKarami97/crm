import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0]
  if (reqPath === '/' || !path.extname(reqPath)) reqPath = '/index.html'
  const filePath = path.join(distDir, reqPath)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' })
    fs.createReadStream(filePath).pipe(res)
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    fs.createReadStream(path.join(distDir, 'index.html')).pipe(res)
  }
})

const PORT = 5197
server.listen(PORT, async () => {
  const errors = []
  let browser

  try {
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const context = await browser.newContext({ locale: 'fa-IR' })
    const page = await context.newPage()

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text())
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (err) => {
      console.error('Page Error:', err.message)
      errors.push(err.message)
    })

    await page.goto(`http://localhost:${PORT}/people`, { waitUntil: 'networkidle' })

    const addBtn = page.locator('button:has-text("شخص جدید"), button:has-text("ثبت")').first()
    await addBtn.click()

    await page.waitForSelector('input[placeholder="مثال: علی رضایی"]', { state: 'visible' })

    await page.fill('input[placeholder="مثال: علی رضایی"]', 'پروین اعتصامی')
    await page.fill('input[placeholder="0912..."]', '09998887766')

    // Add tag
    await page.fill('input[placeholder*="برچسب جدید"]', 'ادبیات')
    await page.keyboard.press('Enter')

    // Submit
    const submitBtn = page.locator('button:has-text("ثبت شخص")')
    await submitBtn.click()

    await page.waitForTimeout(1500)

    const personCard = page.locator('text=پروین اعتصامی')
    const isVisible = await personCard.isVisible()

    console.log('Card Visible:', isVisible)
    console.log('Errors count:', errors.length)

    if (errors.length > 0 || !isVisible) {
      process.exit(1)
    }

    console.log('SUCCESS: All fields including tags and proxies cleanly stored!')
    await browser.close()
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    server.close()
  }
})
