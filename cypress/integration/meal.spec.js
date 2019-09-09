import {
	select,
	mealRows,
	btnMealRowSort,
	mealRowCalDiff,
	pageSize,
	pageNumber,
	btnPrevPage,
	btnNextPage,
	btnIncludeAllMeals,
	mealRowNumCalories,
	userCalorieGoal,
	selectAll,
	filterDateStart,
	mealRowName,
	filterDateEnd,
} from '../../packages/web/src/test'
import {
	createUser,
	deleteMeal,
	createMeal,
	logout,
	updateMeal,
	loginAsUser,
} from './helpers'

const UNIX_ONE_MIN = 1000 * 60
const UNIX_ONE_DAY = UNIX_ONE_MIN * 60 * 24

describe('Meals', () => {
	let confirm

	beforeEach(() => {
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
		updateMeal('test meal', {
			name: 'test meal (updated)',
			numCalories: 99,
		})

		// update should show up in the list
		cy.contains('test meal (updated)')
		cy.contains(`+98 calories`) // over by 98, since 1 cal is the default max

		// deleting should remove the item from the table
		deleteMeal('test meal (updated)')
		cy.contains('test meal').should('not.exist')
		cy.contains(`You don't have any meals yet`)
	})

	it('should sort and paginate meals correctly', () => {
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
				select(mealRowNumCalories(`test meal ${j}`)).should(
					'have.class',
					'bg-danger',
				)
			}

			select(btnPrevPage())
				.parent()
				.should('have.class', 'disabled')
			select(pageNumber()).should('contain', 'Page 1')
			select(btnNextPage())
				.parent()
				.should('have.class', 'disabled')
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

		// with a page size of 2, there be at most 100 calories
		// on the same page - to test that calorie expectations work across
		// pages, the goal is set to 150 since 2 meals will be under this but
		// 7 will be over
		select(userCalorieGoal())
			.clear()
			.type('150')
			.blur()
		cy.wait('@fetchMeals')

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

			// wait for react to render
			cy.contains(`test meal ${page * 2}`)

			// sort is asc right now
			select(mealRows())
				.eq(0)
				.should('contain', `test meal ${page * 2}`)
			if (page < 3) {
				select(mealRows())
					.eq(1)
					.should('contain', `test meal ${page * 2 + 1}`)
			}

			// we are still over the calorie count
			selectAll(mealRowNumCalories(`test meal`)).should(
				'have.class',
				'bg-danger',
			)

			// all items should still have correct differences in
			// calorie expectation
			select(mealRowCalDiff(`test meal ${page * 2}`)).should(
				'contain',
				'+200 calories',
			)
			if (page < 3) {
				select(mealRowCalDiff(`test meal ${page * 2 + 1}`)).should(
					'contain',
					'+200 calories',
				)
			}

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

	it('should choose background colors based on calorie expectation', () => {
		createUser('normal', 250)

		createMeal({ name: 'test meal 0 for normal', numCalories: 100 })
		createMeal({ name: 'test meal 1 for normal', numCalories: 100 })

		// we're good on calories
		select(mealRowNumCalories('test meal 0 for normal')).should(
			'have.class',
			'bg-success',
		)
		select(mealRowNumCalories('test meal 1 for normal')).should(
			'have.class',
			'bg-success',
		)

		// decrease the limit
		select(userCalorieGoal())
			.clear()
			.type('150')
			.blur()
		cy.wait('@fetchMeals')

		// colours should change
		select(mealRowNumCalories('test meal 0 for normal')).should(
			'have.class',
			'bg-danger',
		)
		select(mealRowNumCalories('test meal 1 for normal')).should(
			'have.class',
			'bg-danger',
		)
	})

	it('should allow filtering by date range', () => {
		createUser('normal')

		const now = Date.now()

		createMeal({
			name: '1',
			numCalories: 100,
			createdAt: new Date(now),
		})
		createMeal({
			name: '2',
			numCalories: 100,
			createdAt: new Date(now + UNIX_ONE_DAY),
		})
		createMeal({
			name: '3',
			numCalories: 100,
			createdAt: new Date(now + UNIX_ONE_DAY * 2),
		})

		// all 3 meals have exceeded the limit for their day, but not
		// cummulatively
		for (let i = 0; i < 3; ++i) {
			select(mealRowCalDiff(String(i + 1))).should('contain', '+99 calories')
		}

		// all items should be shown
		select(mealRows()).should('have.length', 3)

		// push the date forward
		select(filterDateStart()).setDate(new Date(now + UNIX_ONE_DAY))
		cy.wait('@fetchMeals')

		// filter to 2 & 3
		select(mealRowName('1')).should('not.exist')
		select(mealRowName('2'))
		select(mealRowName('3'))
		select(mealRows()).should('have.length', 2)
		select(filterDateEnd()).setDate(new Date(UNIX_ONE_MIN + now + UNIX_ONE_DAY))
		cy.wait('@fetchMeals')

		// only 2 should be there
		select(mealRowName('1')).should('not.exist')
		select(mealRowName('2'))
		select(mealRowName('3')).should('not.exist')
		select(mealRows()).should('have.length', 1)

		// filter to only 1
		select(filterDateStart()).setDate(new Date(now))
		cy.wait('@fetchMeals')
		select(filterDateEnd()).setDate(new Date(UNIX_ONE_MIN + now))
		cy.wait('@fetchMeals')
		select(mealRowName('1'))
		select(mealRowName('2')).should('not.exist')
		select(mealRowName('3')).should('not.exist')
		select(mealRows()).should('have.length', 1)

		// filter to only 3
		select(filterDateStart()).setDate(new Date(now + UNIX_ONE_DAY * 2))
		cy.wait('@fetchMeals')
		select(filterDateEnd()).setDate(
			new Date(UNIX_ONE_MIN + now + UNIX_ONE_DAY * 2),
		)
		cy.wait('@fetchMeals')
		select(mealRowName('1')).should('not.exist')
		select(mealRowName('2')).should('not.exist')
		select(mealRowName('3'))
		select(mealRows()).should('have.length', 1)
	})

	it('should allow users and admins to edit user meals', () => {
		createUser('normal')

		createMeal({
			name: 'test meal',
			numCalories: 100,
		})
		select(mealRowName('test meal'))

		updateMeal('test meal', {
			name: 'test meal (updated by user)',
		})
		select(mealRowName('test meal (updated by user)'))
		select(mealRowName('test meal')).should('not.exist')

		logout()
		createUser('admin')
		select(btnIncludeAllMeals('on')).click()
		select(mealRowName('test meal (updated by user)'))
		select(mealRowName('test meal')).should('not.exist')

		updateMeal('test meal (updated by user)', {
			name: 'test meal (updated by admin)',
		})
		select(mealRowName('test meal (updated by admin)'))
		select(mealRowName('test meal (updated by user)')).should('not.exist')

		logout()
		loginAsUser('normal')
		select(mealRowName('test meal (updated by admin)'))
		select(mealRowName('test meal (updated by user)')).should('not.exist')
	})
})
