import { Config } from '@karimsa/boa'

import { server } from './app'

const port = Config.isProductionEnv
	? Config.int('Port')
	: Config.int('Port', 8080)

server.listen(port)
