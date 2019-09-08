import * as bson from 'bson'

import { isAuthenticated, User } from '../models/user'
import { createModel, required, ObjectId } from '../utils/mongo'
import { apiRouter } from '../api'
import { route, validateBody, APIError, HTTPStatus } from '../utils/http'
import { UserDay } from './user-day'

export const Meal = createModel('meal', {
	fields: {
		userID: required(ObjectId),
		name: required(String),
		createdAt: required(Date),
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
		createdAt: 'date!',
	}),
	route(async req => {
		const meal = await Meal.create({
			name: req.body.name,
			numCalories: req.body.numCalories,
			createdAt: req.body.createdAt,
			userID: new bson.ObjectId(req.session.userID),
		})

		const mealData = meal.toJSON()
		mealData.dayID = UserDay.getDayIDFromMeal(meal)
		mealData.caloriesForDay = await UserDay.addMeal(meal)
		return mealData
	}),
)

apiRouter.put(
	'/meals',
	isAuthenticated,
	validateBody('body', {
		_id: 'string!',
		name: 'string',
		numCalories: 'number',
		createdAt: 'date',
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

		const oldCalories = meal.numCalories

		if (req.body.name) {
			meal.name = req.body.name
		}
		if (req.body.numCalories) {
			meal.numCalories = req.body.numCalories
		}
		if (req.body.createdAt) {
			meal.createdAt = req.body.createdAt
		}

		await meal.save()

		const mealData = meal.toJSON()
		mealData.dayID = UserDay.getDayIDFromMeal(meal)
		mealData.caloriesForDay = await UserDay.updateMeal(oldCalories, meal)
		return mealData
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
		await UserDay.removeMeal(meal)
		return meal
	}),
)

apiRouter.get(
	'/meals',
	isAuthenticated,
	validateBody('query', {
		userID: 'string',
		minCreatedAt: 'number',
		maxCreatedAt: 'number',
		$skip: 'number!',
		$limit: 'number!',
		$sortBy: 'string!',
		$sortOrder: 'string!',
	}),
	route(async req => {
		const {
			minCreatedAt,
			maxCreatedAt,
			$skip,
			$limit,
			$sortBy,
			$sortOrder,
		} = req.query
		const query = {}

		if (typeof minCreatedAt === 'number' || typeof maxCreatedAt === 'number') {
			query.createdAt = {}

			if (typeof minCreatedAt === 'number') {
				query.createdAt.$gte = new Date(minCreatedAt)
			}
			if (typeof maxCreatedAt === 'number') {
				query.createdAt.$lte = new Date(maxCreatedAt)
			}
		}

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

			query.userID = new bson.ObjectId(req.query.userID)
		} else if (req.session.userType !== 'admin') {
			throw new APIError(
				`Non-admin users are not allowed to view everyone's meals.`,
				HTTPStatus.Forbidden,
				`Non-admin users are not allowed to view everyone's meals.`,
			)
		}

		const meals = await Meal.find(query)
			.sort({
				[$sortBy]: $sortOrder === 'ASC' ? 1 : -1,
			})
			.skip($skip)
			.limit($limit + 1)

		const userDayPromises = new Map()
		const userPromises = new Map()
		const mappedMeals = new Array(Math.min($limit, meals.length))

		for (let i = 0; i < mappedMeals.length; ++i) {
			const meal = meals[i]
			const mealData = meal.toJSON()

			mappedMeals[i] = (async function() {
				// everyone needs to see daily calorie info
				const dayID = UserDay.getDayIDFromMeal(meal)
				let userDayPromise = userDayPromises.get(dayID)
				if (!userDayPromise) {
					userDayPromise = UserDay.getNumCaloriesForDay(meal)
					userDayPromises.set(dayID, userDayPromise)
				}
				mealData.dayID = UserDay.getDayIDFromMeal(meal)
				mealData.caloriesForDay = await userDayPromise

				// admins need to see user information
				if (!query.userID) {
					let userPromise = userPromises.get(meal.userID)
					if (!userPromise) {
						userPromise = User.findById(meal.userID)
						userPromises.set(meal.userID, userPromise)
					}
					const user = await userPromise
					mealData.user = user.toJSON()
				}

				return mealData
			})()
		}

		return {
			meals: await Promise.all(mappedMeals),
			hasNextPage: meals.length > $limit,
		}
	}),
)
