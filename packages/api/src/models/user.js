import * as crypto from 'crypto'
import * as util from 'util'

import * as bcrypt from 'bcrypt'
import { logger } from '@karimsa/boa'

import { APIError, HTTPStatus, route, validateBody } from '../utils/http'
import { createModel, required } from '../utils/mongo'
import { apiRouter } from '../api'

const randomBytes = util.promisify(crypto.randomBytes)

export const User = createModel('user', {
	fields: {
		type: required(String),
		name: required(String),
		email: required(String),
		password: required(String),
		dailyCalMax: required(Number),
	},

	methods: {
		toJSON() {
			return {
				_id: this._id,
				type: this.type,
				name: this.name,
				email: this.email,
				dailyCalMax: this.dailyCalMax,
			}
		},
	},

	indexes: [
		{
			fields: {
				email: 1,
			},
			options: {
				unique: true,
			},
		},
	],
})

User.on('index', error => {
	if (error) {
		logger.error('User index error', error)
	}
})

export function isAuthenticated(req, _, next) {
	const { userID, authToken, userType } = req.session
	const authHeader = String(req.headers.authorization).split(' ')
	logger.debug('caltracker:auth', 'Authenticated route hit with: %O', {
		userID,
		userType,
		authToken,
		authHeader,
	})

	if (
		authHeader[0] === 'Bearer' &&
		userID &&
		authToken &&
		userType &&
		authHeader[1] === authToken
	) {
		return next()
	}

	throw new APIError('User is not logged in', HTTPStatus.Unauthorized)
}

apiRouter.get(
	'/users/current',
	isAuthenticated,
	route(async req => {
		const user = await User.findById(req.session.userID)
		if (!user) {
			throw new APIError(
				'Wrong username',
				HTTPStatus.Unauthorized,
				'Wrong username/password',
			)
		}
		return user
	}),
)

apiRouter.post(
	'/users/login',
	validateBody('body', {
		email: 'string!',
		password: 'string!',
	}),
	route(async req => {
		const { email, password } = req.body
		const user = await User.findOne({ email })
		if (!user) {
			throw new APIError(
				'Wrong username',
				HTTPStatus.Unauthorized,
				'Wrong username/password',
			)
		}

		if (!(await bcrypt.compare(password, user.password))) {
			throw new APIError(
				'Wrong password',
				HTTPStatus.Unauthorized,
				'Wrong username/password',
			)
		}

		req.session.userID = String(user._id)
		req.session.userType = user.type
		const token = (req.session.authToken = (await randomBytes(16)).toString(
			'hex',
		))

		return {
			userID: req.session.userID,
			token,
		}
	}),
)

apiRouter.post(
	'/users',
	validateBody('body', {
		type: 'string!',
		name: 'string!',
		email: 'string!',
		password: 'string!',
		dailyCalMax: 'number!',
	}),
	route(async req => {
		const { type, name, email, password, dailyCalMax } = req.body
		const passwordHash = await bcrypt.hash(password, 10)

		try {
			return await User.create({
				type,
				name,
				email,
				password: passwordHash,
				dailyCalMax,
			})
		} catch (error) {
			if (String(error).includes('duplicate key error')) {
				throw new APIError(
					`A user already exists with the email address '${email}'`,
					HTTPStatus.BadRequest,
					`A user already exists with the email address '${email}'`,
				)
			}
			throw error
		}
	}),
)

apiRouter.put(
	'/users',
	validateBody('body', {
		_id: 'string!',
		dailyCalMax: 'number!',
	}),
	route(async req => {
		if (
			req.session.userID !== req.body._id &&
			req.session.userType === 'normal'
		) {
			throw new APIError(
				`Normal users may not change properties of other users`,
				HTTPStatus.Forbidden,
				`Normal users may not change properties of other users`,
			)
		}

		const user = await User.findById(req.body._id)
		if (!user) {
			throw new APIError(
				`Could not find user with ID: ${req.body._id}`,
				HTTPStatus.NotFound,
				`Could not find user`,
			)
		}

		user.dailyCalMax = req.body.dailyCalMax
		await user.save()
		return user
	}),
)
