import puppeteer from 'puppeteer'
import { Accountant } from "./../accountant.model"
import { CsvService } from './csvService'
import { BookKeeperContactsModel } from '../models/index'

export class BookKeepersService {

  parse = async (): Promise<boolean> => {

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // Get types
    const typeLinks = await this._getTypeLinks(page)
    console.log('Links', typeLinks)

    for (const type of typeLinks) {
      await this.parseType(type, page)
    }

    browser.close()
    return true
  }

  parseType = async (typeLink: string, page: puppeteer.Page): Promise<void> => {
    const url = typeLink
    // http://www.bookkeeperscentral.co.uk/service-types/accountant/2
    console.log(`Start parse '${typeLink}'`)
    let fetchMore = true
    let currentPage = 1

    do {
      const pageUrl = `${url}/${currentPage}`
      await page.goto(pageUrl, { waitUntil: 'networkidle2' })
      console.log(`..parse page '${pageUrl}'`)
      const customerLinks = await page.evaluate(() => {
        const ahrefArray = document.querySelectorAll('h3.captlize > a')
        const links = []
        ahrefArray.forEach(x => links.push((x as any).href))
        return links
      })

      for (let i = 0; i < customerLinks.length; i++) {
        const customerLink = customerLinks[i]
        await this.processCustomerPage(customerLink, page)
      }

      currentPage++
      fetchMore = currentPage < 2 && customerLinks.length > 0
    } while (fetchMore)
  }

  private processCustomerPage = async (customerLink: string, page: puppeteer.Page) => {
    await page.goto(customerLink, { waitUntil: 'networkidle2' })

    const customerData = await page.evaluate(() => {
      const contacts = document.querySelectorAll('ul.extra-service > li> div > div.icon-box-text')
      const arr: string[] = []
      contacts.forEach(x => arr.push((x as any).innerText))

      // /^(?=.*\d)[\d ]+$/
      // const contactObj = new BookKeeperContactsModel()
      // for (const c of arr) {
      //   if (c.indexOf('facebook') > -1) {
      //     contactObj.facebook = c
      //     continue
      //   }

      //   if (c.indexOf('twitter') > -1) {
      //     contactObj.twitter = c
      //     continue
      //   }

      //   if (c.indexOf('linkedin') > -1) {
      //     contactObj.linkedIn = c
      //     continue
      //   }

      //   // TODO: try get name
      //   // TODO: try get phones
      //   // TODO: try get emails
      //   // TODO: try get other links
      // }

      const descriptionArray = document.querySelectorAll('div.block-body > p')
      const darr = []
      descriptionArray.forEach(x => {
        if ((x as HTMLElement).innerText) {
          darr.push((x as HTMLElement).innerText)
        }
      })

      const servicesElement = document.querySelectorAll('ul.avl-features.third > li > a')
      const services = []
      servicesElement.forEach(x => {
        if ((x as HTMLElement).innerText) {
          services.push((x as HTMLElement).innerText)
        }
      })

      return { contacts: arr, desc: darr.join(','), services }
    })

    console.log(`customer data`, customerData)
  }

  private _getTypeLinks = async (page: puppeteer.Page): Promise<string[]> => {

    const url = 'http://www.bookkeeperscentral.co.uk/service-types'
    await page.goto(url, { waitUntil: 'networkidle2' })

    return await page.evaluate(() => {
      const types = document.querySelectorAll('div.searchBySpecInner > div > a')
      const links = []
      types.forEach(x => links.push((x as any).href))
      return links
    })
  }

}