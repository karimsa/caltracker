import express from 'express'
import * as bodyParser from 'body-parser'
import session from 'express-session'
import createRedisStore from 'connect-redis'
import cors from 'cors'
import { Config } from '@karimsa/boa'

import * as mongo from './services/mongoose'

export function route(fn) {
	return async (req, res) => {
		try {
			await mongo.Connect()
			const body = await fn(req, res)
			if (typeof body === 'object') {
				res.json(body)
			} else if (body === undefined) {
				res.json({ status: 'ok' })
			} else {
				throw new Error(
					`Routes must return a valid body (got return type of ${typeof body})`,
				)
			}
		} catch (error) {
			res.status(error.status || 500)
			res.json({
				status: 'error',
				error: error.displayMessage || String(error),
				displayMessage: Boolean(error.displayMessage),
			})
		}
	}
}

export const sessionParser = session({
	secret: Config.string('ServerCookieSecret'),
	resave: true,
	saveUninitialized: false,
	store: new (createRedisStore(session))({
		port: Config.int('RedisPort', 6379),
		host: Config.string('RedisHost', 'localhost'),
		password: Config.isProductionEnv
			? Config.string('RedisPassword')
			: undefined,
	}),
})

export const apiRouter = express()
apiRouter.use(
	cors({
		origin: Config.string('ServerUrl'),
		credentials: true,
	}),
)
apiRouter.head(/.*/, (_, res) => {
	res.end()
})
apiRouter.use(bodyParser.json())
apiRouter.use(sessionParser)
