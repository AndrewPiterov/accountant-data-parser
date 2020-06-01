import { BookKeepersService } from './services'

(async () => {
  console.log('Start...')

  const service = new BookKeepersService()
  await service.parse()

  console.log('Success!')
})()