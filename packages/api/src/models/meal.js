import * as bson from 'bson'

import { isAuthenticated, User } from '../models/user'
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

	hooks: {
		pre: {
			async validate() {
				if (
					this.numCalories < 0 ||
					Math.floor(this.numCalories) !== this.numCalories ||
					!this.numCalories ||
					isNaN(this.numCalories)
				) {
					throw new Error(`Calories must be a valid positive integer value`)
				}
			},
		},
	},
})

apiRouter.post(
	'/meals',
	isAuthenticated,
	validateBody('body', {
		name: 'string!',
		numCalories: 'number!',
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
		name: 'string',
		numCalories: 'number',
	}),
	route(async req => {
		const meal = await Meal.findById(req.body._id)
		if (!meal) {
			throw new APIError(
				`Could not find meal with ID: ${req.body._id}`,
				HTTPStatus.NotFound,
				`Could not find meal`,
			)
		}

		if (req.body.name) {
			meal.name = req.body.name
		}
		if (req.body.numCalories) {
			meal.numCalories = req.body.numCalories
		}

		await meal.save()
		return meal
	}),
)

apiRouter.delete(
	'/meals',
	isAuthenticated,
	validateBody('query', {
		_id: 'string!',
	}),
	route(async req => {
		const meal = await Meal.findById(req.query._id)
		if (!meal) {
			throw new APIError(
				`Could not find meal with ID: ${req.body._id}`,
				HTTPStatus.NotFound,
				`Could not find meal`,
			)
		}
		await meal.remove()
		return meal
	}),
)

apiRouter.get(
	'/meals',
	isAuthenticated,
	validateBody('query', {
		userID: 'string',
		$skip: 'number!',
		$limit: 'number!',
		$sortBy: 'string!',
		$sortOrder: 'string!',
	}),
	route(async req => {
		const { $skip, $limit, $sortBy, $sortOrder } = req.query

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
					[$sortBy]: $sortOrder === 'ASC' ? 1 : -1,
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

		const userPromises = new Map()
		const meals = await Meal.find()
			.sort({
				[$sortBy]: $sortOrder === 'ASC' ? 1 : -1,
			})
			.skip($skip)
			.limit($limit)
		return Promise.all(
			meals.map(async meal => {
				let userPromise = userPromises.get(meal.userID)
				if (!userPromise) {
					userPromise = User.findById(meal.userID)
					userPromises.set(meal.userID, userPromise)
				}
				const user = await userPromise
				const mealData = meal.toJSON()
				mealData.userName = user.name
				return mealData
			}),
		)
	}),
)
