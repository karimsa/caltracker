import express from 'express'
import * as bodyParser from 'body-parser'
import session from 'express-session'
import createRedisStore from 'connect-redis'
import cors from 'cors'
import { Config } from '@karimsa/boa'

import * as mongo from './services/mongoose'
import { route, validateBody } from './utils/http'

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

apiRouter.use(async (_, __, next) => {
	const fakeDelay = Config.int('ServerFakeDelay', 0)
	if (fakeDelay > 0) {
		await new Promise(resolve => setTimeout(resolve, fakeDelay))
	}

	next()
})

const startTime = Date.now()
apiRouter.get('/status', (_, res) => {
	res.json({
		uptime: Date.now() - startTime,
	})
})

export const settings = {
	shouldAllowCreation: Config.bool(
		'AllowAdminCreation',
		Config.isDevelopmentEnv,
	),
}

if (Config.isTestEnv) {
	apiRouter.put(
		'/settings',
		validateBody('body', {
			shouldAllowCreation: 'boolean!',
		}),
		route(req => {
			return Object.assign(settings, req.body)
		}),
	)
}

apiRouter.get('/settings', route(() => settings))

if (Config.isTestEnv) {
	apiRouter.post(
		'/reset-db',
		route(async () => {
			await mongo.Connect()
			await mongo.mongoose.connection.dropDatabase()

			for (const name of mongo.mongoose.modelNames()) {
				const model = mongo.mongoose.model(name)
				await model.ensureIndexes()
			}

			settings.shouldAllowCreation = true

			return { status: 'ok' }
		}),
	)
}
