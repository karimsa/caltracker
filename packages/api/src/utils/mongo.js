import { logger, Config } from '@karimsa/boa'

import { mongoose } from '../services/mongoose'

export const ObjectId = mongoose.Schema.Types.ObjectId
export const Mixed = mongoose.Schema.Types.Mixed

export function createModel(name, model) {
	const schema = new mongoose.Schema(model.fields)

	if (model.indexes) {
		for (const index of model.indexes) {
			logger.debug('caltracker:db', `Creating index on ${name}: %O`, index)
			schema.index(index.fields, {
				...(index.options || {}),
				background: Config.isProductionEnv,
			})
		}
	}

	if (model.hooks) {
		if (model.hooks.pre) {
			for (const event of Object.keys(model.hooks.pre)) {
				schema.pre(event, model.hooks.pre[event])
			}
		}
		if (model.hooks.post) {
			for (const event of Object.keys(model.hooks.post)) {
				schema.post(event, model.hooks.post[event])
			}
		}
	}

	for (const name of Object.keys(model.methods || {})) {
		schema.methods[name] = model.methods[name]
	}

	return mongoose.model(name, schema)
}

export function required(type, defaultValue) {
	if (defaultValue !== undefined) {
		return { type, required: true, default: defaultValue }
	}
	return { type, required: true }
}
