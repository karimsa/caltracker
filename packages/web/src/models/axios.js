import axiosMod from 'axios'

let authToken = localStorage.getItem('authToken')
let userID = localStorage.getItem('userID')

export function hasAuthInfo() {
	return Boolean(authToken && userID)
}

export function getAuthToken() {
	return authToken
}

export function getCurrentUserID() {
	return userID
}

export function setAuthToken(token, givenUserID) {
	if (!(authToken = token)) {
		throw new Error(`Authentication token must be provided to do set`)
	}
	if (!(userID = givenUserID)) {
		throw new Error(`UserID must be provided for authentication`)
	}
	localStorage.setItem('authToken', token)
	localStorage.setItem('userID', userID)
}

export function removeAuthToken() {
	authToken = undefined
	userID = undefined
	localStorage.removeItem('authToken')
	localStorage.removeItem('userID')
}

export const data = fn => (...args) => fn(...args).then(d => d.data)

export const apiHost = ({
	// TODO: Add production & staging URLs here

	local: location.hostname,
})[process.env.ENV_TARGET || 'local']

export const apiPort = (process.env.ENV_TARGET || 'local') === 'local' ? 8080 : 443
export const useSecureAPI = process.env.NODE_ENV === 'production'

export const axios = axiosMod.create({
	baseURL: `http${useSecureAPI ? 's' : ''}://${apiHost}:${apiPort}/api/v0`,
	withCredentials: true,
})

axios.interceptors.request.use(req => {
	if (authToken) {
		req.headers.Authorization = `Bearer ${authToken}`
	}
	return req
})

axios.interceptors.response.use(res => res, error => {
	// For non-login routes, we should automatically detect when the user is logged out
	// and eject them back to the login screen
	if (
		error.config &&
		!error.config.url.endsWith('/users/login') &&
		!error.config.url.endsWith('/users/current') &&
		error.response &&
		error.response.status === 401
	) {
		console.warn('Forcing redirect to /login')
		removeAuthToken()
		location.href = '/login'
		return
	}

	if (String(error).match(/network error/i) || (error.response && error.response.data && error.response.data.error && error.response.status >= 500)) {
		return Promise.reject(new Error('The application is currently unavailable. Please try again later.'))
	}

	// For errors in which the backend has intentionally sent a message, we should rewrite
	// the error object so the UI can only be concerned with the UI bits
	if (error.response && error.response.data && error.response.data.error && error.response.status < 500) {
		if (error.response.data.displayMessage) {
			console.warn(`Rewriting error message:`, error.response.data)
		}
		const newError = new Error(error.response.data.displayMessage ? error.response.data.error : 'Something went wrong. Please try again later.')
		newError.response = error.response
		return Promise.reject(newError)
	}

	// For all other errors (such as network errors), we should simply
	// return the error as-is
	return Promise.reject(error)
})
