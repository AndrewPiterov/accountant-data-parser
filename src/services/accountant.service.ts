import puppeteer from 'puppeteer'
import { AccountantModel } from "../models"
import { CsvService } from './csvService'

export class AccountantService {
  public parse = async (): Promise<boolean> => {
    const BASE_URL = 'https://www.accountant-magnet.com/accountants'

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const csv = null // TODO: new CsvService()
    csv.addHeader()

    for (let i = 1337; i <= 9000; i++) {
      const accountantUrl = `${BASE_URL}/${i}`
      console.log(`Start to process '${accountantUrl}'`)
      await page.goto(accountantUrl, { waitUntil: 'networkidle2' })

      const accountantData = await page.evaluate(() => {
        // try {
        const title = (document.querySelector('div[class="white-card display-flex"] > div > h1') as HTMLElement)
        const arr = document.querySelectorAll('div[class="acct-card-contact"] p')
        const email = (arr[0] as HTMLElement)
        const phone = (arr[1] as HTMLElement)
        const address = (arr[2] as HTMLElement)
        const qualifiedBy = (document.querySelector('div#qual-box > p') as HTMLElement)

        const specializingIn = []
        document.querySelectorAll('div.card-service').forEach(x => {
          if (x as HTMLElement) {
            specializingIn.push((x as HTMLElement).innerText)
          }
        })

        const services = []
        document.querySelectorAll('div.industry-service').forEach(x => {
          if (x as HTMLElement) {
            services.push((x as HTMLElement).innerText)
          }
        })

        const acc: AccountantModel = {
          firmName: title ? title.innerText : '',
          email: email ? email.innerText : '',
          phone: phone ? phone.innerText : '',
          address: address ? address.innerText : '',
          qualifiedIn: qualifiedBy ? qualifiedBy.innerText : '',
          specializingIn,
          industryFocus: services
        }

        return acc
        // } catch (e) {
        //   console.log(e)
        //   return null
        // }
      })

      if (!accountantData) {
        console.log('BREAK')
        break
      }

      // console.log(`${i}) acc`, accountantData)
      // TODO: csv.writeToFile(accountantData)
    }

    browser.close()
    return true
  }
}
