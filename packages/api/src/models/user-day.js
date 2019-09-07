import { createModel, required, ObjectId } from '../utils/mongo'

export const UserDay = createModel('userDay', {
	fields: {
		userID: required(ObjectId),
		dayID: required(String),
		numCalories: required(Number, 0),
	},

	indexes: [
		{
			fields: {
				userID: 1,
				dayID: 1,
			},

			options: {
				unique: true,
			},
		},
	],
})

UserDay.getDayIDFromDate = function getDayIDFromDate(date) {
	return [
		date.getTimezoneOffset(),
		date.getMonth(),
		date.getDate(),
		date.getFullYear(),
	].join('-')
}

UserDay.getDayIDFromMeal = function getDayIDFromMeal(meal) {
	return UserDay.getDayIDFromDate(meal.createdAt)
}

UserDay.getNumCaloriesForDay = async function(meal) {
	const userDay = await UserDay.findOne({
		userID: meal.userID,
		dayID: UserDay.getDayIDFromMeal(meal),
	})
	if (!userDay) {
		return 0
	}
	return userDay.numCalories
}

UserDay.addMeal = async function(meal) {
	const userDay = await UserDay.findOneAndUpdate(
		{
			userID: meal.userID,
			dayID: UserDay.getDayIDFromMeal(meal),
		},
		{
			$inc: {
				numCalories: meal.numCalories,
			},
		},
		{
			upsert: true,
			new: true,
		},
	)
	return userDay.numCalories
}

UserDay.removeMeal = async function(meal) {
	const userDay = await UserDay.findOneAndUpdate(
		{
			userID: meal.userID,
			dayID: UserDay.getDayIDFromMeal(meal),
		},
		{
			$inc: {
				numCalories: -meal.numCalories,
			},
		},
		{
			upsert: true,
			new: true,
		},
	)
	return userDay.numCalories
}
