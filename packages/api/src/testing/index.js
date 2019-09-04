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

	async createUser(creds) {
		await this.request('post', this.apiUrl('/users'))
			.send(creds)
			.expect(handleApiError)

		return (await this.request('post', this.apiUrl('/users/login'))
			.send(creds)
			.expect(handleApiError)).body
	}

	async getCurrentUser({ authToken }) {
		const res = await this.request('get', this.apiUrl('/users/current'))
			.set('Authorization', `Bearer ${authToken}`)
			.expect(handleApiError)
		return res.body
	}

	async updateCurrentUser({ authToken }, user) {
		const res = await this.request('put', this.apiUrl('/users/current'))
			.set('Authorization', `Bearer ${authToken}`)
			.send(user)
			.expect(handleApiError)
		return res.body
	}
}

export async function createApi({ apiVersion } = {}) {
	await mongo.Connect()
	await mongo.mongoose.connection.db.dropDatabase()

	const api = new API(apiVersion || 'v0')
	return api
}

export const test = global.test
export const expect = global.expect
