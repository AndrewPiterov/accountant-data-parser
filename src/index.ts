import { BookKeepersService, CsvService } from './services'
import "reflect-metadata"
import { createConnection, ConnectionOptions, Repository } from "typeorm"
import { root } from './path'
import { Accountant } from './entities'

(async () => {

  const options: ConnectionOptions = {
    type: "sqlite",
    database: `${root}/output/bookkeeprs.sqlite`,
    entities: [Accountant],
    // logging: true,
    synchronize: true,
  }

  createConnection(options).then(async (connection) => {

    console.log('Start...')

    const service = new BookKeepersService(connection, new CsvService('./output/bookkeepers.csv'))
    await service.createCsv()

    console.log('Success!')

  }).catch(error => console.log(error))

})()