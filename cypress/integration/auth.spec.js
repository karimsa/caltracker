describe('Authentication', () => {
	beforeEach(() => {
		cy.request('POST', 'http://localhost:8080/api/v0/reset-db')
		cy.clearCookies()
		cy.clearLocalStorage()
	})

	it('should allow registration', () => {
		cy.visit('http://localhost:1234/')

		// try logging in, it should fail
		cy.location('pathname').should('eq', '/login')
		cy.contains('Sign in')
		cy.contains('Error').should('not.exist')
		cy.get('[type="email"]').type('test@test.co')
		cy.get('[type="password"]').type('testing')
		cy.contains('Login').click()
		cy.contains('Wrong username')

		// try registering, it should not work if passwords don't match
		cy.contains('Create a new account').click()
		cy.contains('Error').should('not.exist')
		cy.contains('Register')
		cy.get('[placeholder*="name"]').type('Test User')
		cy.get('[type="email"]').should('have.value', 'test@test.co')
		cy.get('[type="password"]').eq(0).should('have.value', 'testing')
		cy.get('[type="password"]').eq(1).type('not-testing')
		cy.contains('button', 'Register').should('have.attr', 'disabled')
		cy.contains('Error').should('not.exist')
		cy.contains(`Passwords don't match`).should('be.visible')

		// should work if passwords match
		cy.get('[type="password"]').eq(1).clear().type('testing')
		cy.contains(`Passwords don't match`).should('not.be.visible')
		cy.contains('Error').should('not.exist')
		cy.contains('button', 'Register').should('not.have.attr', 'disabled')
		cy.contains('button', 'Register').click()

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
		cy.get('[type="email"]').type('test@test.co')
		cy.get('[type="password"]').type('testing')
		cy.contains('Login').click()
		cy.location('pathname').should('eq', '/')

		// should stay logged in
		cy.reload()
		cy.location('pathname').should('eq', '/')
		cy.contains('Welcome back, Test User!')
	})
})
