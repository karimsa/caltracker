import {
	select,
	btnManageUsers,
	btnEditUser,
	modalUser,
	modalUserType,
	modalUserSubmit,
	userRowType,
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
		select(modalUser('edit')).should('not.have.class', 'show')
		select(userRowType('Normal User')).should('contain', 'Manager')

		logout()
		loginAsUser('normal')
		select(btnManageUsers())
	})
})
