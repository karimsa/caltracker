// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

beforeEach(() => {
	cy.request('POST', 'http://localhost:8080/api/v0/reset-db')
	cy.clearCookies()
	cy.clearLocalStorage()
	cy.visit('http://localhost:1234/')

	cy.server()

	// User routes
	cy.route({
		method: 'POST',
		url: 'http://localhost:8080/api/v0/users',
	}).as('createUser')
	cy.route({
		method: 'PUT',
		url: 'http://localhost:8080/api/v0/users',
	}).as('updateUser')
	cy.route({
		method: 'PUT',
		url: 'http://localhost:8080/api/v0/users/current',
	}).as('getCurrentUser')
	cy.route({
		method: 'POST',
		url: 'http://localhost:8080/api/v0/users/login',
	}).as('login')

	// Meal routes
	cy.route({
		method: 'GET',
		url: 'http://localhost:8080/api/v0/meals**',
	}).as('fetchMeals')
	cy.route({
		method: 'POST',
		url: 'http://localhost:8080/api/v0/meals',
	}).as('createMeal')
	cy.route({
		method: 'PUT',
		url: 'http://localhost:8080/api/v0/meals',
	}).as('updateMeal')
	cy.route({
		method: 'DELETE',
		url: 'http://localhost:8080/api/v0/meals**',
	}).as('deleteMeal')

	cy.on('window:before:load', win => {
		const printError = win.console.error
		cy.stub(win.console, 'error', error => {
			printError(error)
			expect(error).not.to.exist()
		}).as('console.error')
	})
})
