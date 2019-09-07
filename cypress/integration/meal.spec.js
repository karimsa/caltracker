import {
	select,
	btnMealEdit,
	editMealModal,
	mealModalSubmit,
	mealModalName,
	mealModalCalories,
	btnMealDelete,
	createMealModal,
	mealRows,
	btnMealRowSort,
	mealRowCalDiff,
	pageSize,
	pageNumber,
	btnPrevPage,
	btnNextPage,
	registerUserType,
	registerUserName,
	loginEmail,
	loginPassword,
	registerConfirmPassword,
	btnIncludeAllMeals,
} from '../../packages/web/src/test'

function createUser(type) {
	cy.visit('http://localhost:1234/')
	cy.contains('Create a new account').click()
	cy.contains('Register')
	select(registerUserType()).select(type)
	select(registerUserName()).type(
		`${type[0].toUpperCase()}${type.substr(1)} User`,
	)
	select(loginEmail()).type(`${type}@${type}.co`)
	select(loginPassword()).type('testing')
	select(registerConfirmPassword()).type('testing')
	cy.contains('button', 'Register').click()
}

function createMeal({ name, numCalories }) {
	cy.contains('Add meal').click()
	select(createMealModal()).should('have.class', 'show')
	select(mealModalSubmit('create')).should('have.attr', 'disabled')
	cy.get('[placeholder*="name of your meal"]').type(name)
	select(mealModalSubmit('create')).should('have.attr', 'disabled')
	cy.get('[placeholder*="number of calories"]').type(String(numCalories))
	select(mealModalSubmit('create')).click()
	select(createMealModal()).should('not.have.class', 'show')
	select(createMealModal()).should('not.exist')
}

function deleteMeal(name) {
	select(btnMealDelete(name)).click()
	cy.wait('@deleteMeal')
}

function logout() {
	cy.contains('Logout').click()
}

// function loginAsUser(type) {
// 	cy.visit('http://localhost:1234/')
// 	cy.contains('Sign in')
// 	cy.get('[type="email"]').type(`${type}@${type}.co`)
// 	cy.get('[type="password"]').type('testing')
// 	cy.contains('button', 'Login').click()
// }

describe('Meals', () => {
	let confirm

	beforeEach(() => {
		cy.request('POST', 'http://localhost:8080/api/v0/reset-db')
		cy.clearCookies()
		cy.clearLocalStorage()

		cy.server()
		cy.route({
			method: 'GET',
			url: 'http://localhost:8080/api/v0/meals**',
		}).as('fetchMeals')
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

		confirm = cy.spy().as('window.confirm')
		cy.on('window:confirm', confirm)
	})

	it('should allow creating meals for your own account', () => {
		createUser('normal')

		// add a meal as normal
		createMeal({ name: 'test meal', numCalories: 100 })

		// should show up in the list
		cy.contains('test meal')
		cy.contains(`+99 calories`) // over by 99, since 1 cal is the default max

		// should be able to edit the entry
		select(btnMealEdit('test meal')).click()
		cy.contains('Edit meal')
		select(editMealModal('test meal')).should('have.class', 'show')
		select(mealModalSubmit('update')).should('not.have.attr', 'disabled')
		select(mealModalName('edit')).should('have.value', 'test meal')
		select(mealModalName('edit')).type(' (updated)')
		select(mealModalCalories('edit'))
			.clear()
			.type('99')
		select(mealModalSubmit('edit')).click()

		// update should show up in the list
		cy.contains('test meal (updated)')
		cy.contains(`+98 calories`) // over by 98, since 1 cal is the default max

		// deleting should remove the item from the table
		deleteMeal('test meal (updated)')
		cy.contains('test meal').should('not.exist')
		cy.contains(`You don't have any meals yet`)
	})

	it.only('should sort meals correctly', () => {
		createUser('normal')

		for (let i = 0; i < 7; ++i) {
			createMeal({ name: `test meal ${i}`, numCalories: 50 })

			for (let j = 0; j <= i; j++) {
				cy.contains(`test meal ${j}`)
				select(mealRowCalDiff(`test meal ${j}`)).should('have.length', 1)
				select(mealRowCalDiff(`test meal ${j}`)).should(
					'contain',
					`+${(i + 1) * 50 - 1} calories`,
				)
			}
		}

		select(mealRows()).should('have.length', 7)
		cy.get(`[data-test^="${mealRowCalDiff('test meal ')}"]`).should(
			'contain',
			'+349 calories',
		)

		// verify descending sort
		select(btnMealRowSort('asc')).should('not.have.class', 'active')
		select(btnMealRowSort('desc')).should('have.class', 'active')
		for (let i = 0; i < 7; ++i) {
			select(mealRows())
				.eq(i)
				.contains(`test meal ${6 - i}`)
		}

		// switch sort order and verify
		select(btnMealRowSort('asc')).click()
		select(btnMealRowSort('asc')).should('have.class', 'active')
		select(btnMealRowSort('desc')).should('not.have.class', 'active')
		cy.wait('@fetchMeals')
		for (let i = 0; i < 7; ++i) {
			select(mealRows())
				.eq(i)
				.contains(`test meal ${i}`)
		}

		// should trim the results on pagination change
		select(pageNumber()).should('contain', 'Page 1')
		select(btnPrevPage())
			.parent()
			.should('have.class', 'disabled')
		select(btnNextPage())
			.parent()
			.should('have.class', 'disabled')
		select(pageSize())
			.clear()
			.type('2')
			.blur()
		select(btnNextPage())
			.parent()
			.should('not.have.class', 'disabled')
		select(pageNumber()).should('contain', 'Page 1')

		// verify order across pages
		for (let page = 0; page < 4; ++page) {
			// prev should only be disabled on the first page
			if (page === 0) {
				select(btnPrevPage())
					.parent()
					.should('have.class', 'disabled')
			} else {
				select(btnPrevPage())
					.parent()
					.should('not.have.class', 'disabled')
			}

			// all pages should have 2 items, except the last
			if (page === 3) {
				select(mealRows()).should('have.length', 1)
			} else {
				select(mealRows()).should('have.length', 2)
			}

			// sort is asc right now
			select(mealRows())
				.eq(0)
				.should('contain', `test meal ${page * 2}`)
			if (page < 3) {
				select(mealRows())
					.eq(1)
					.should('contain', `test meal ${page * 2 + 1}`)
			}

			// all items should still have correct differences in
			// calorie expectation
			cy.get(`[data-test^="${mealRowCalDiff('test meal ')}"]`).should(
				'contain',
				'+349 calories',
			)

			// next should only be disabled on the last page
			if (page < 3) {
				select(btnNextPage())
					.parent()
					.should('not.have.class', 'disabled')

				select(btnNextPage()).click()
				select(pageNumber()).should('contain', `Page ${page + 2}`)
				cy.wait('@fetchMeals')
			} else {
				select(btnNextPage())
					.parent()
					.should('have.class', 'disabled')
			}
		}

		// deleting item 6 should take us back a page
		deleteMeal('test meal 6')
		cy.contains('test meal 6').should('not.exist')
		select(pageNumber()).should('contain', 'Page 3')
		select(btnNextPage())
			.parent()
			.should('have.class', 'disabled')

		// deleting item 3 & 5 should remove the next page
		deleteMeal('test meal 5') // delete 5 on page 3
		select(btnPrevPage()).click() // go back to page 2, which has meals 2 and 3
		cy.wait('@fetchMeals')
		select(pageNumber()).should('contain', 'Page 2')
		deleteMeal('test meal 3') // delete 3
		cy.wait('@fetchMeals')
		select(pageNumber()).should('contain', 'Page 2') // still on page 2, which should still have 2 but should pull back 4
		select(mealRows())
			.eq(0)
			.should('contain', 'test meal 2')
		select(mealRows())
			.eq(1)
			.should('contain', 'test meal 4')

		// login as manager
		logout()
		createUser('manager')

		// manager sees nothing
		cy.contains(`You don't have any meals`)
		select(btnIncludeAllMeals('on')).should('not.exist')
		select(btnIncludeAllMeals('off')).should('not.exist')

		// login as admin
		logout()
		createUser('admin')

		// verify that nothing is seen by default
		cy.wait('@fetchMeals')
		cy.contains(`You don't have any meals`)

		// but it is possible to view everything
		select(btnIncludeAllMeals('on')).click()
		cy.wait('@fetchMeals')
		cy.contains(`You don't have any meals`).should('not.exist')
		select(mealRows()).should('have.length', 4) // started with 7, deleted 3 to test
	})
})
