import * as http from 'http'

import express from 'express'
import morgan from 'morgan'
import { Config, logger } from '@karimsa/boa'

const app = express()
export const server = http.createServer(app)

app.use(
	morgan('dev', {
		skip(_, res) {
			return Config.isProductionEnv || res.statusCode > 399
		},
	}),
)

server.on('error', error => {
	logger.error(`Failed to start HTTP server`, error)
	process.exit(1)
})

server.on('listening', () => {
	logger.info(`HTTP Server started at :%O`, server.address().port)
})
