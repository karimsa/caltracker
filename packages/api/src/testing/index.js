import * as path from 'path'

import request from 'supertest'
import { logger } from '@karimsa/boa'

import { app } from '../app'
import * as mongo from '../services/mongoose'

export function fixture(filepath) {
	return path.resolve(__dirname, 'fixtures', filepath)
}

export function expectStatus(status) {
	return function(res) {
		if (res.status !== status) {
			if (res.body.error) {
				logger.fatalf(
					`Request failed with status ${res.status} (expected ${status}): ${res.body.error.stack} - %O`,
					res.body,
				)
			} else {
				logger.fatalf(
					`Request failed with status ${res.status} (expected ${status}): %O`,
					res.error || res.body,
				)
			}
		}
	}
}

export const handleApiError = expectStatus(200)

export class API {
	constructor(apiVersion) {
		this.API_PREFIX = '/api'
		this.apiVersion = apiVersion
		this.authJar = []
		this.agent = request.agent(app)
	}

	request(method, route) {
		return this.agent[method](route)
	}

	apiUrl(route) {
		return path.join(this.API_PREFIX, this.apiVersion, route)
	}

	async createUsers(types) {
		return (this.authJar = await Promise.all(
			types.map((type, index) => {
				return this.createUser({
					type,
					name: `Test ${index}`,
					email: `test-${index}@example.com`,
					password: 'testing',
				})
			}),
		))
	}

	async createUser(creds) {
		const agent = request.agent(app)

		await agent
			.post(this.apiUrl('/users'))
			.send(creds)
			.expect(handleApiError)

		const { userID, token } = (await agent
			.post(this.apiUrl('/users/login'))
			.send(creds)
			.expect(handleApiError)).body

		return {
			userID,
			token,
			agent: agent.set('Authorization', `Bearer ${token}`),
		}
	}

	async getCurrentUser({ agent }) {
		return (await agent
			.get(this.apiUrl('/users/current'))
			.expect(handleApiError)).body
	}

	async updateCurrentUser({ agent }, user) {
		return (await agent
			.put(this.apiUrl('/users/current'))
			.send(user)
			.expect(handleApiError)).body
	}
}

export async function createApi({ apiVersion } = {}) {
	await mongo.Connect()
	await mongo.mongoose.connection.dropDatabase()

	for (const name of mongo.mongoose.modelNames()) {
		const model = mongo.mongoose.model(name)
		await model.ensureIndexes()
	}

	const api = new API(apiVersion || 'v0')
	return api
}

export const test = global.test
export const expect = global.expect
