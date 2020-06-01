import puppeteer from 'puppeteer'

(async () => {
  console.log('Start...')
  const BASE_URL = 'https://www.accountant-magnet.com/accountants'

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  for (let i = 1; i <= 10; i++) {
    const accountantUrl = `${BASE_URL}/${i}`

    console.log(`Start to process '${accountantUrl}'`)

    await page.goto(accountantUrl, { waitUntil: 'networkidle2' })

    const accountantData = await page.evaluate(() => {
      const title = (document.querySelector('div[class="white-card display-flex"] > div > h1') as HTMLElement).innerText
      const email = (document.querySelector('div[class="acct-card-contact"] p') as HTMLElement).innerText

      return {
        title,
        email
      }
    })

    console.log(`${i}) acc`, accountantData)
  }

  browser.close()

  console.log('Success!')
})()