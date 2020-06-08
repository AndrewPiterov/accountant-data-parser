import { AccountantModel } from "../models"

const fs = require('fs')

export class CsvService {

  constructor(private readonly _csvFilepath: string) { }

  // public addHeader = () => {
  //   const header = `FirmName;Phone;Email;Address;SpecializingIn;QualifiedIn;IndustryFocus`;
  //   this.addRow(header)
  // }

  // public writeToFile = async (acc: AccountantModel): Promise<boolean> => {
  //   const row = `${acc.firmName};${acc.phone};${acc.email};${acc.address};${acc.specializingIn.join(',')};${acc.qualifiedIn};${acc.industryFocus.join(',')}`;
  //   this.addRow(row)
  //   return true
  // }

  public addRow = (row: string) => {
    fs.appendFile(this._csvFilepath, `\r\n${row}`, (err) => {
      if (err) {
        console.log('Could not append row', err)
      } else {
        // done
      }
    })
  }
}