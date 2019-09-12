import { axios, data } from './axios'

export const Settings = {
	get: data(() => axios.get('/settings')),
}
