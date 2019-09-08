import { mem } from '../mem'
import { axios, data, getCurrentUserID, getAuthToken } from './axios'

const getCurrentUser = mem(() =>
	axios.get('/users/current').catch(error => {
		if (error.response && error.response.status !== undefined) {
			return error.response
		}
		throw error
	}),
)

export const User = {
	getCurrentUser: cacheBuster =>
		getCurrentUser(
			String(cacheBuster) + getCurrentUserID() + ':' + getAuthToken(),
		),
	get: data(params => axios.get('/users', { params })),
	login: data(body => axios.post('/users/login', body)),
	create: data(body => axios.post('/users', body)),
	update: data(body => axios.put('/users', body)),
	delete: data(userID => axios.delete('/users', { params: { _id: userID } })),
}
