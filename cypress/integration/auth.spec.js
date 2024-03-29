import {
	select,
	loginEmail,
	loginPassword,
	registerUserName,
	registerConfirmPassword,
} from '../../packages/web/src/test'

describe('Authentication', () => {
	it('should allow registration', () => {
		// try logging in, it should fail
		cy.location('pathname').should('eq', '/login')
		cy.contains('Sign in')
		cy.contains('Error').should('not.exist')
		select(loginEmail()).type('test@test.co')
		select(loginPassword()).type('testing')
		cy.contains('Login').click()
		cy.contains('Wrong username')

		// try registering, it should not work if passwords don't match
		cy.contains('Create a new account').click()
		cy.contains('Error').should('not.exist')
		cy.contains('Register')
		select(registerUserName()).type('Test User')
		select(loginEmail()).should('have.value', 'test@test.co')
		select(loginPassword()).should('have.value', 'testing')
		select(registerConfirmPassword()).type('not-testing')
		cy.contains('button', 'Register').should('have.attr', 'disabled')
		cy.contains('Error').should('not.exist')
		cy.contains(`Passwords don't match`).should('be.visible')

		// should work if passwords match
		select(registerConfirmPassword())
			.clear()
			.type('testing')
		cy.contains(`Passwords don't match`).should('not.be.visible')
		cy.contains('Error').should('not.exist')
		cy.contains('button', 'Register').should('not.have.attr', 'disabled')
		cy.contains('button', 'Register').click()
		cy.wait('@createUser')

		// should take you back home
		cy.location('pathname').should('eq', '/')
		cy.contains('Welcome, Test User!')
		cy.contains(`You don't have any meals`)

		// should stay logged in
		cy.reload()
		cy.location('pathname').should('eq', '/')
		cy.contains('Welcome back, Test User!')
		cy.contains(`You don't have any meals`)

		// logging out should stay logged out
		cy.contains('Logout').click()
		cy.location('pathname').should('eq', '/login')
		cy.reload()

		// should be able to login now
		cy.location('pathname').should('eq', '/login')
		cy.contains('Sign in')
		cy.contains('Error').should('not.exist')
		select(loginEmail()).type('test@test.co')
		select(loginPassword()).type('testing')
		cy.contains('Login').click()
		cy.wait('@login')
		cy.location('pathname').should('eq', '/')

		// should stay logged in
		cy.reload()
		cy.location('pathname').should('eq', '/')
		cy.contains('Welcome back, Test User!')

		// should not allow registration with the same email address
		cy.contains('Logout').click()
		cy.contains('Create a new account').click()
		select(registerUserName()).type('Test User')
		select(loginEmail()).type('test@test.co')
		select(loginPassword()).type('testing')
		select(registerConfirmPassword()).type('testing')
		cy.contains('button', 'Register').click()
		cy.wait('@createUser')
		cy.contains('user already exists')
	})
})
