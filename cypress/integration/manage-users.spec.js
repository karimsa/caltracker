import {
	select,
	btnManageUsers,
	btnEditUser,
	modalUser,
	modalUserType,
	modalUserSubmit,
	userRowType,
	registerUserType,
} from '../../packages/web/src/test'
import { createUser, logout, loginAsUser } from './helpers'

describe('User management', () => {
	it('should allow managers to manage users', () => {
		createUser('normal')
		select(btnManageUsers()).should('not.exist')
		logout()

		createUser('manager')
		select(btnManageUsers()).click()

		cy.location('pathname').should('eq', '/users')

		select(userRowType('Normal User')).should('contain', 'User')
		select(btnEditUser('Normal User')).click()
		select(modalUser('edit')).should('have.class', 'show')
		select(modalUserType('edit')).select('admin')
		select(modalUserSubmit('edit')).click()
		cy.contains('cannot elevate')
		select(modalUser('edit')).should('have.class', 'show')

		select(modalUserType('edit')).select('manager')
		select(modalUserSubmit('edit')).click()
		cy.contains('cannot elevate').should('not.exist')
		cy.wait('@updateUser')
		select(userRowType('Normal User')).should('contain', 'Manager')

		logout()
		loginAsUser('normal')
		select(btnManageUsers())
	})

	it('should not allow selecting user type in production', () => {
		cy.contains('Create a new account').click()

		select(registerUserType())

		cy.request('PUT', 'http://localhost:8080/api/v0/settings', {
			shouldAllowCreation: false,
		})

		cy.reload()
		cy.contains('Create a new account').click()
		select(registerUserType()).should('not.exist')

		cy.request('PUT', 'http://localhost:8080/api/v0/settings', {
			shouldAllowCreation: true,
		})

		cy.reload()
		cy.contains('Create a new account').click()
		select(registerUserType())
	})
})
