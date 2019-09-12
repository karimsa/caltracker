export const HTTPStatus = {
	BadRequest: 400,
	Unauthorized: 401,
	Forbidden: 403,
	NotFound: 404,
}

export class APIError extends Error {
	constructor(message, status = 500, displayMessage) {
		super(message)
		this.status = status
		this.displayMessage = displayMessage
	}
}

export function route(handler) {
	return async (req, res, next) => {
		try {
			let nextWasCalled = false
			const body = await handler(req, res, error => {
				nextWasCalled = true
				next(error)
			})
			if (typeof body === 'object' && body !== null) {
				res.json(body)
			} else if (!nextWasCalled) {
				throw new Error(`Route did not call next or return a valid body`)
			}
		} catch (error) {
			res.status(error.status || 500)
			res.json({
				error: String(
					error.displayMessage ||
						error.message ||
						'The application is currently unavailable. Please try again later.',
				),
				displayMessage: Boolean(error.displayMessage),
			})
		}
	}
}

export function validateBody(dataType, types) {
	const checks = Object.keys(types).map(name => {
		const type = types[name]
		const check = {
			name: name,
			type,
			required: false,
		}
		if (type[type.length - 1] === '!') {
			check.required = true
			check.type = type.substr(0, type.length - 1)
		}
		return check
	})
	return route((req, _, next) => {
		const body = req[dataType]
		for (const check of checks) {
			const value = body[check.name]
			if (value == null && check.required) {
				throw new APIError(
					`'${check.name}' is required but was not provided`,
					HTTPStatus.BadRequest,
					`'${check.name}' is required but was not provided`,
				)
			}

			if (body.hasOwnProperty(check.name)) {
				if (check.type === 'number') {
					body[check.name] = Number(value)
					if (isNaN(body[check.name])) {
						throw new Error(
							`'${check.name}' must be a valid number (not "${value}")`,
						)
					}
				} else if (check.type === 'string') {
					if (!value) {
						throw new APIError(
							`'${check.name}' was not provided (got '${value}')`,
							HTTPStatus.BadRequest,
							`'${check.name}' was not provided`,
						)
					}
				} else if (check.type === 'date') {
					body[check.name] = new Date(value)
					if (String(body[check.name]) === 'Invalid Date') {
						throw new APIError(
							`'${check.name}' is not a valid date (got '${value}')`,
							HTTPStatus.BadRequest,
							`'${check.name}' is not a valid date`,
						)
					}
				} else if (check.type === 'boolean') {
					if (typeof value !== 'boolean') {
						throw new APIError(
							`Invalid value given for '${
								check.name
							}', expected true or false (got ${JSON.stringify(value)})`,
							HTTPStatus.BadRequest,
							`Invalid value given for '${
								check.name
							}', expected true or false (got ${JSON.stringify(value)})`,
						)
					}
				} else {
					throw new Error(`Cannot validate type: ${check.type}`)
				}
			}
		}

		next()
	})
}
