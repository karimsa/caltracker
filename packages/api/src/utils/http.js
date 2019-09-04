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
	return async (req, res) => {
		try {
			const body = await handler(req, res)
			res.json(body)
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
	return (req, res, next) => {
		try {
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

				if (check.type === 'number') {
					body[check.name] = Number(value)
					if (isNaN(body[check.name])) {
						throw new Error(
							`'${check.name}' must be a valid number (not "${value}")`,
						)
					}
				} else if (check.type !== 'string') {
					throw new Error(`Cannot validate type: ${check.type}`)
				}
			}

			next()
		} catch (error) {
			res.status(400)
			res.json({
				error: String(error.message || error),
			})
		}
	}
}
