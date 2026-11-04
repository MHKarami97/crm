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
    const indexHtml = path.join(distDir, 'index.html')
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    fs.createReadStream(indexHtml).pipe(res)
  }
})

const PORT = 5198
server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`)

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
        console.error('Browser Console Error:', msg.text())
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (err) => {
      console.error('Unhandled Page Error:', err.message)
      errors.push(err.message)
    })

    await page.goto(`http://localhost:${PORT}/people`, { waitUntil: 'networkidle' })

    // 1. Click on "شخص جدید" button
    console.log('Clicking "شخص جدید" button...')
    const addBtn = page.locator('button:has-text("شخص جدید"), button:has-text("ثبت")').first()
    await addBtn.click()

    // 2. Wait for modal / bottom sheet to be visible
    await page.waitForSelector('input[placeholder="مثال: علی رضایی"]', { state: 'visible' })

    // 3. Fill in fields
    console.log('Filling form fields...')
    await page.fill('input[placeholder="مثال: علی رضایی"]', 'سهراب سپهری')
    await page.fill('input[placeholder="0912..."]', '09123456789')
    await page.fill('textarea[placeholder="نکات مهم و یادداشت‌های مربوط به این شخص..."]', 'شاعر و نقاش کاشانی')

    // 4. Click Submit button "ثبت شخص"
    console.log('Clicking "ثبت شخص" button...')
    const submitBtn = page.locator('button:has-text("ثبت شخص")')
    await submitBtn.click()

    // 5. Wait for toast or modal to close
    await page.waitForTimeout(1500)

    // 6. Verify that "سهراب سپهری" is rendered in the list
    const personCard = page.locator('text=سهراب سپهری')
    const isVisible = await personCard.isVisible()

    console.log('Person Card Visible:', isVisible)
    console.log('Encountered Errors count:', errors.length)

    if (errors.length > 0) {
      console.error('ERRORS FOUND:', errors)
      process.exit(1)
    }

    if (!isVisible) {
      console.error('Failed to find newly added person on screen!')
      process.exit(1)
    }

    console.log('SUCCESS: Person added to IndexedDB and rendered without any DataCloneError!')
    await browser.close()
  } catch (err) {
    console.error('Test execution failed:', err)
    process.exit(1)
  } finally {
    server.close()
  }
})
