import { BookKeeperContactsModel } from '../models/bookkepperContacts.model'

export const extractContacts = (list: string[]): BookKeeperContactsModel => {

  const o: BookKeeperContactsModel = {
    phones: [],
    emails: [],
    nonRecognized: [],
    website: ''
  }

  for (let i = 0; i < list.length; i++) {
    const contact = list[i]
    if (i === 0) {
      o.address = contact
      continue
    }

    if (contact.indexOf('facebook') > -1) {
      o.facebook = contact
      continue
    }

    if (contact.indexOf('twitter') > -1) {
      o.twitter = contact
      continue
    }

    if (contact.indexOf('linkedin') > -1) {
      o.linkedIn = contact
      continue
    }

    const arr = contact.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
    if (arr) {
      o.emails = arr
      continue
    }

    if (contact.startsWith('http')) {
      o.website += ` ${contact}`
      continue
    }

    if (/^(?=.*\d)[\d ]+$/.test(contact)) {
      o.phones.push(contact)
      continue
    }

    o.nonRecognized.push(contact)
  }

  return o
}