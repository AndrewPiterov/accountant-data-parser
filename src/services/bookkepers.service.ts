import puppeteer from 'puppeteer'
// import { Accountant } from "../models/accountant.model"
import { CsvService } from './csvService'
import { BookKeeperContactsModel } from '../models/index'
import { Connection } from 'typeorm'
import { Accountant } from '../entities'
import { extractContacts } from './funcs'
import colors from 'colors'


colors.setTheme({
  info: 'bgGreen',
  help: 'cyan',
  warn: 'yellow',
  success: 'bgBlue',
  error: 'red'
})

interface ParseOptions {
  skipTypes: string[]
  perType: any[]
}

export class BookKeepersService {

  repo = this._conn.getRepository(Accountant)

  constructor(private _conn: Connection, private readonly _csvService: CsvService) {

  }

  parse = async (): Promise<boolean> => {

    return

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
    const page = await browser.newPage()

    // Get types
    const typeLinks = await this._getTypeLinks(page)
    console.log('LINKS', typeLinks)

    const opt: ParseOptions = {
      skipTypes: [
        'accountant', 'advice', 'assessment', 'audit',
        'bookkeeping',
        'certified', 'charity', 'chartered', 'commercial', 'compliance', 'construction', 'consultant', 'contractor', 'corporate',
        'estate',
        'filing',
        'formation', 'freelance', 'inheritance', 'insolvency', 'insurance'
      ],
      perType: [{ type: 'invoicing', fromPage: 36 }]
    }

    try {
      for (const typeLink of typeLinks) {
        const typeName = typeLink.split('/').reverse()[0]
        if (opt.skipTypes.includes(typeName)) {
          console.log(`TYPE '${typeLink} will be skipped!'`)
          continue
        }
        const typeParseOption = opt.perType.find(x => x.type === typeName)
        await this._parseType(typeName, typeParseOption, page)
      }
    } catch (error) {
      console.log(`ERROR`, error)
      return false
    } finally {
      browser.close()
    }

    return true
  }

  public createCsv = async (): Promise<void> => {
    this._csvService.addRow('FirmName;Address;Phone;Email;WebSite;Facebook;Twitter;LinkedIn;ServicesOffered')
    const list = await this.repo.find()
    for (const acc of list) {
      this._csvService.addRow(`${acc.companyName ?? ''};${acc.address ?? ''};${acc.phone ?? ''};${acc.email ?? ''};${acc.website ?? ''};${acc.facebook ?? ''};${acc.twitter ?? ''};${acc.linkedIn ?? ''};${acc.services ?? ''}`)
    }
    console.log('CSV file has been saved.'.bgBlue)
  }

  private _parseType = async (typeName: string, parseOption: any, puppeteerPage: puppeteer.Page): Promise<void> => {
    const url = `http://www.bookkeeperscentral.co.uk/service-types/${typeName}`
    console.log(`Start parse type '${typeName}'`)
    let fetchMore = true

    parseOption = parseOption ? parseOption : {}
    let currentPage = parseOption.fromPage ? parseOption.fromPage : 1
    // console.log(`START PARSE FROM ${currentPage}`, parseOption)

    do {
      const pageUrl = `${url}/${currentPage}`
      await puppeteerPage.goto(pageUrl, { waitUntil: 'networkidle2' })
      console.log(`..parse page '${pageUrl}'`)

      const customerLinks = await puppeteerPage.evaluate(() => {
        const ahrefArray = document.querySelectorAll('h3.captlize > a')
        const links = []
        ahrefArray.forEach(x => links.push((x as any).href))
        return links
      })

      for (let i = 0; i < customerLinks.length; i++) {
        const customerLink = customerLinks[i]
        await this._processCustomerPage(customerLink, puppeteerPage)
        console.log(`${typeName}:${currentPage}:${i}) customer has been processed.`)
      }

      currentPage++
      fetchMore = customerLinks.length > 0
    } while (fetchMore)
  }

  private _processCustomerPage = async (customerLink: string, page: puppeteer.Page): Promise<void> => {
    console.log(`.... start parse customer '${customerLink}'`)
    await page.goto(customerLink, { waitUntil: 'networkidle2' })
    const id = customerLink.split('/').reverse()[0]

    if (await this.repo.findOne(id)) {
      console.log('SHOULD SKIP')
      return
    }

    const customerData = await page.evaluate(() => {
      const name = (document.querySelector('div.tr-list-info h4') as HTMLElement) ? (document.querySelector('div.tr-list-info h4') as HTMLElement).innerText : '-'
      const contacts = document.querySelectorAll('ul.extra-service > li> div > div.icon-box-text')
      const arr: string[] = []
      contacts.forEach(x => {
        const v = (x as any)
        if (v && v.innerText) {
          arr.push(v.innerText)
        }
      })
      const descriptionArray = document.querySelectorAll('div.block-body > p')
      const darr = []
      descriptionArray.forEach(x => {
        const v = (x as HTMLElement)
        if (v && v.innerText) {
          darr.push(v.innerText)
        }
      })

      const servicesElement = document.querySelectorAll('ul.avl-features.third > li > a')
      const services = []
      servicesElement.forEach(x => {
        const v = (x as HTMLElement)
        if (v && v.innerText) {
          services.push(v.innerText)
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