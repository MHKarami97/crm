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

const PORT = 5196
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
        console.error('Browser Error:', msg.text())
        errors.push(msg.text())
      }
    })

    // 1. Visit /people
    await page.goto(`http://localhost:${PORT}/people`, { waitUntil: 'networkidle' })

    // 2. Ensure at least one existing contact exists (e.g. Person 1: نیما یوشیج)
    const addBtn = page.locator('button:has-text("شخص جدید"), button:has-text("ثبت")').first()
    await addBtn.click()
    await page.waitForSelector('input[placeholder="مثال: علی رضایی"]', { state: 'visible' })
    await page.fill('input[placeholder="مثال: علی رضایی"]', 'نیما یوشیج')
    await page.click('button:has-text("ثبت شخص")')
    await page.waitForTimeout(1000)

    // 3. Now add Person 2 (سهراب سپهری) and connect him to "نیما یوشیج" right in the same form!
    console.log('Adding Person 2 with inline relationship...')
    await addBtn.click()
    await page.waitForSelector('input[placeholder="مثال: علی رضایی"]', { state: 'visible' })
    await page.fill('input[placeholder="مثال: علی رضایی"]', 'سهراب سپهری')

    // Check that target select has "نیما یوشیج"
    const targetSelect = page.locator('select:has-text("نیما یوشیج")')
    await targetSelect.waitFor({ state: 'visible' })
    await targetSelect.selectOption({ label: 'نیما یوشیج' })

    // Choose "همکار"
    await page.click('button:has-text("همکار")')

    // Click "افزودن پیوند"
    await page.click('button:has-text("افزودن پیوند")')
    await page.waitForTimeout(500)

    // Verify drafted connection appears in list
    const draftedItem = page.locator('span:has-text("نیما یوشیج")')
    const hasDrafted = await draftedItem.isVisible()
    console.log('Drafted relationship visible in form:', hasDrafted)

    // Capture screenshot of form with inline relationship
    const outputDir = 'C:\\Users\\M.Karami\\.gemini\\antigravity\\brain\\6e653027-908c-41a1-8806-4310ed97fcee\\screenshots'
    await page.screenshot({
      path: path.join(outputDir, 'person-form-with-relations.png'),
    })

    // Save Person
    await page.click('button:has-text("ثبت شخص")')
    await page.waitForTimeout(1500)

    // 4. Click on "سهراب سپهری" to check detail sheet
    await page.click('h4:has-text("سهراب سپهری")')
    await page.waitForTimeout(800)

    // Verify relationship in detail sheet
    const detailRel = page.locator('span:has-text("نیما یوشیج")').first()
    const relVisible = await detailRel.isVisible()
    console.log('Relationship visible in detail sheet:', relVisible)

    if (errors.length > 0 || !hasDrafted || !relVisible) {
      console.error('Test failed!')
      process.exit(1)
    }

    console.log('SUCCESS: Inline relationship creation verified!')
    await browser.close()
  } catch (err) {
    console.error('Test execution failed:', err)
    process.exit(1)
  } finally {
    server.close()
  }
})
