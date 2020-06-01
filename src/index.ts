import puppeteer from 'puppeteer'
import { Accountant } from "./accountant.model"
import { CsvService } from './csvService'

(async () => {
  console.log('Start...')
  const BASE_URL = 'https://www.accountant-magnet.com/accountants'

  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const csv = new CsvService()
  csv.addHeader()

  for (let i = 1; i <= 9000; i++) {
    const accountantUrl = `${BASE_URL}/${i}`
    console.log(`Start to process '${accountantUrl}'`)
    await page.goto(accountantUrl, { waitUntil: 'networkidle2' })

    const accountantData = await page.evaluate(() => {
      try {
        const title = (document.querySelector('div[class="white-card display-flex"] > div > h1') as HTMLElement).innerText
        const arr = document.querySelectorAll('div[class="acct-card-contact"] p')
        const email = (arr[0] as HTMLElement).innerText
        const phone = (arr[1] as HTMLElement).innerText
        const address = (arr[2] as HTMLElement).innerText // (document.querySelector('div[class="acct-card-contact"] p[class="text-bold"]') as HTMLElement).innerText
        const qualifiedBy = (document.querySelector('div#qual-box > p') as HTMLElement).innerText

        const specializingIn = []
        document.querySelectorAll('div.card-service').forEach(x => {
          specializingIn.push((x as HTMLElement).innerText)
        })

        const services = []
        document.querySelectorAll('div.industry-service').forEach(x => {
          services.push((x as HTMLElement).innerText)
        })

        const acc: Accountant = {
          firmName: title,
          email,
          phone,
          address,
          qualifiedIn: qualifiedBy,
          specializingIn,
          industryFocus: services
        }

        return acc
      } catch (e) {
        console.log(e)
        return null
      }
    })

    if (!accountantData) {
      console.log('BREAK')
      break
    }

    // console.log(`${i}) acc`, accountantData)
    csv.writeToFile(accountantData)
  }

  browser.close()
  console.log('Success!')
})()