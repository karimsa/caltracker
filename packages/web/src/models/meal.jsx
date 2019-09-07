import PropTypes from 'prop-types'

import { axios, data } from './axios'

export const Meal = {
	create: data(body => axios.post('/meals', body)),
	update: data(body => axios.put('/meals', body)),
	delete: data(mealID => axios.delete('/meals', { params: { _id: mealID } })),
	find: data(params => axios.get('/meals', { params })),
}

export const MealShape = PropTypes.shape({
	_id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	numCalories: PropTypes.number.isRequired,
	dayID: PropTypes.string.isRequired,
	caloriesForDay: PropTypes.number.isRequired,
	createdAt: PropTypes.string.isRequired,
}).isRequired
