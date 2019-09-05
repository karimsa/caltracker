import * as bson from 'bson'

import { isAuthenticated } from '../models/user'
import { createModel, required, ObjectId } from '../utils/mongo'
import { apiRouter } from '../api'
import { route, validateBody, APIError, HTTPStatus } from '../utils/http'

export const Meal = createModel('meal', {
	fields: {
		userID: required(ObjectId),
		name: required(String),
		createdAt: required(Date, Date.now),
		numCalories: required(Number),
	},

	indexes: [
		{
			fields: {
				userID: 1,
			},
		},
	],
})

apiRouter.post(
	'/meals',
	isAuthenticated,
	validateBody('body', {
		name: 'string!',
		numCalories: 'number',
	}),
	route(async req => {
		return Meal.create({
			name: req.body.name,
			numCalories: req.body.numCalories,
			userID: new bson.ObjectId(req.session.userID),
		})
	}),
)

apiRouter.put(
	'/meals',
	isAuthenticated,
	validateBody('body', {
		_id: 'string!',
	}),
	route(async req => {
		const results = await Meal.updateOne(
			{ _id: new bson.ObjectId(req.body._id) },
			{ $set: req.body },
		)
		if (!results.ok) {
			throw new Error(`Update query returned not ok`)
		}
		if (results.nModified !== 1) {
			throw new Error(
				`Unexpected number of documents updated: ${results.nModified} (expected 1)`,
			)
		}
	}),
)

apiRouter.delete(
	'/meals',
	isAuthenticated,
	validateBody('query', {
		_id: 'string!',
	}),
	route(async req => {
		const results = await Meal.deleteOne({
			_id: new bson.ObjectId(req.query._id),
		})
		if (!results.ok) {
			throw new Error(`Update query returned not ok`)
		}
		if (results.deletedCount !== 1) {
			throw new Error(
				`Unexpected number of documents deleted: ${results.deletedCount} (expected 1)`,
			)
		}
	}),
)

apiRouter.get(
	'/meals',
	isAuthenticated,
	validateBody('query', {
		userID: 'string',
		$skip: 'number!',
		$limit: 'number!',
		$orderBy: 'string!',
	}),
	route(async req => {
		const { $skip, $limit, $orderBy } = req.query

		if (req.query.userID) {
			if (
				req.session.userID !== req.query.userID &&
				req.session.userType !== 'admin'
			) {
				throw new APIError(
					`Non-admin users are not allowed to view other user's meals.`,
					HTTPStatus.Forbidden,
					`Non-admin users are not allowed to view other user's meals.`,
				)
			}

			return Meal.find({
				userID: new bson.ObjectId(req.query.userID),
			})
				.sort({
					[$orderBy]: 1,
				})
				.skip($skip)
				.limit($limit)
		}

		if (req.session.userType !== 'admin') {
			throw new APIError(
				`Non-admin users are not allowed to view everyone's meals.`,
				HTTPStatus.Forbidden,
				`Non-admin users are not allowed to view everyone's meals.`,
			)
		}
		return Meal.find()
			.sort({
				[$orderBy]: 1,
			})
			.skip($skip)
			.limit($limit)
	}),
)
