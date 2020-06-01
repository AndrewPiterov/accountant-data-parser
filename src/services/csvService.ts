import { Accountant } from "../accountant.model"

const fs = require('fs')

const addRow = (row: string) => {
  fs.appendFile('./output/list.csv', `\r\n${row}`, (err) => {
    if (err) {
      console.log('Could not append row', err)
    } else {
      // done
    }
  })
}

export class CsvService {

  public addHeader = () => {
    const header = `FirmName;Phone;Email;Address;SpecializingIn;QualifiedIn;IndustryFocus`;
    addRow(header)
  }

  public writeToFile = async (acc: Accountant): Promise<boolean> => {
    const row = `${acc.firmName};${acc.phone};${acc.email};${acc.address};${acc.specializingIn.join(',')};${acc.qualifiedIn};${acc.industryFocus.join(',')}`;
    addRow(row)
    return true
  }
}