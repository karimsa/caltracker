import { Config, logger } from '@karimsa/boa'

import * as mongo from './services/mongoose'
import { server } from './app'

const port = Config.isProductionEnv
	? Config.int('Port')
	: Config.int('Port', 8080)

mongo
	.Connect()
	.then(() => {
		server.listen(port)
	})
	.catch(error => {
		logger.error('Could not connect to mongo', error)
		process.exit(1)
	})
