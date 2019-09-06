import { axios, data } from './axios'

export const Meal = {
	create: data(body => axios.post('/meals', body)),
	update: data(body => axios.put('/meals', body)),
	delete: data(mealID => axios.delete('/meals', { params: { _id: mealID } })),
	find: data(params => axios.get('/meals', { params })),
}
