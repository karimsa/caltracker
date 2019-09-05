import { axios, data } from './axios'

export const Meal = {
	create: data(body => axios.post('/meals', body)),
	update: data(body => axios.post('/meals', body)),
	find: data(params => axios.get('/meals', { params })),
}
