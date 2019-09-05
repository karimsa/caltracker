import { axios, data } from './axios'

export const User = {
	getCurrentUser: () =>
		axios.get('/users/current').catch(error => {
			if (error.response && error.response.status !== undefined) {
				return error.response
			}
			throw error
		}),
	login: data(body => axios.post('/users/login', body)),
	create: data(body => axios.post('/users', body)),
}
