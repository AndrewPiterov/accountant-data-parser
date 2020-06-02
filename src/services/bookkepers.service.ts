import puppeteer from 'puppeteer'
// import { Accountant } from "../models/accountant.model"
import { CsvService } from './csvService'
import { BookKeeperContactsModel } from '../models/index'
import { Connection } from 'typeorm'
import { Accountant } from '../entities'
import { extractContacts } from './funcs'

export class BookKeepersService {

  repo = this._conn.getRepository(Accountant)

  constructor(private _conn: Connection) {

  }

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

    const typeName = typeLink.split('/').reverse()[0]

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
        console.log(`${typeName}:${currentPage}:${i}) customer has been processed.`)
      }

      currentPage++
      fetchMore = currentPage < 2 && customerLinks.length > 0
    } while (fetchMore)
  }

  private processCustomerPage = async (customerLink: string, page: puppeteer.Page): Promise<void> => {
    console.log(`.... start parse customer '${customerLink}'`)
    await page.goto(customerLink, { waitUntil: 'networkidle2' })
    const id = customerLink.split('/').reverse()[0]

    if (await this.repo.findOne(id)) {
      console.log('SHOULD SKIP')
      return
    }

    const customerData = await page.evaluate(() => {
      const name = (document.querySelector('div.tr-list-info h4') as HTMLElement).innerText
      const contacts = document.querySelectorAll('ul.extra-service > li> div > div.icon-box-text')
      const arr: string[] = []
      contacts.forEach(x => arr.push((x as any).innerText))
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

      return {
        name,
        contacts: arr,
        services,
        desc: darr.join(',')
      }
    })

    if (customerData) {

      const contacts: BookKeeperContactsModel = extractContacts(customerData.contacts)

      const entity: Accountant = {
        id,
        companyName: customerData.name,
        phone: contacts.phones.join(','),
        email: contacts.emails.join(','),
        address: contacts.address,
        facebook: contacts.facebook,
        twitter: contacts.twitter,
        linkedIn: contacts.linkedIn,
        website: contacts.website,
        services: customerData.services.join(','),
        about: customerData.desc,
        more: contacts.nonRecognized.join(',')
      }

      await this.repo.save(entity)
    }

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