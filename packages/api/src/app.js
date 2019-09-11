import * as http from 'http'

import express from 'express'
import morgan from 'morgan'
import { Config, logger } from '@karimsa/boa'

import { apiRouter } from './api'

// Import routes
import './models/user'
import './models/meal'

export const app = express()
export const server = http.createServer(app)

app.use(
	Config.isTestEnv
		? morgan('dev', {
				skip(_, res) {
					return res.statusCode < 399
				},
		  })
		: morgan('dev'),
)
app.use((req, res, next) => {
	if (String(req.headers['user-agent']).startsWith('curl/')) {
		res.json = function(body) {
			res.set('Content-Type', 'application/json')
			res.end(JSON.stringify(body, null, '\t'))
		}
	}
	next()
})
app.use('/api/v0', apiRouter)

server.on('error', error => {
	logger.error(`Failed to start HTTP server`, error)
	process.exit(1)
})

server.on('listening', () => {
	logger.info(`HTTP Server started at :%O`, server.address().port)
})
