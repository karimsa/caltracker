import {
	select,
	mealModalSubmit,
	btnMealDelete,
	createMealModal,
	registerUserType,
	registerUserName,
	loginEmail,
	loginPassword,
	registerConfirmPassword,
	registerNumCalories,
	btnMealEdit,
	editMealModal,
	mealModalName,
	mealModalCalories,
	mealModalCreated,
} from '../../packages/web/src/test'

export function createUser(type, numCalories = 1) {
	cy.contains('Create a new account').click()
	cy.contains('Register')
	select(registerUserType()).select(type)
	select(registerUserName()).type(
		`${type[0].toUpperCase()}${type.substr(1)} User`,
	)
	select(loginEmail()).type(`${type}@${type}.co`)
	select(loginPassword()).type('testing')
	select(registerConfirmPassword()).type('testing')
	select(registerNumCalories())
		.clear()
		.type(String(numCalories))
	cy.contains('button', 'Register').click()
	cy.wait('@createUser')
	cy.wait('@fetchMeals')
}

export function createMeal({ name, numCalories, createdAt }) {
	cy.contains('Add meal').click()
	select(createMealModal()).should('have.class', 'show')
	select(mealModalSubmit('create')).should('have.attr', 'disabled')
	select(mealModalName('create')).type(name)
	select(mealModalSubmit('create')).should('have.attr', 'disabled')
	select(mealModalCalories('create')).type(String(numCalories))
	if (createdAt) {
		select(mealModalCreated('create')).setDate(createdAt)
	}
	select(mealModalSubmit('create')).click()
	cy.wait('@createMeal')
	select(createMealModal()).should('not.have.class', 'show')
	select(createMealModal()).should('not.exist')
}

export function updateMeal(currentName, { name, numCalories }) {
	select(btnMealEdit(currentName)).click()
	cy.contains('Edit meal')
	select(editMealModal(currentName)).should('have.class', 'show')
	select(mealModalSubmit('update')).should('not.have.attr', 'disabled')
	select(mealModalName('edit'))
		.clear()
		.type(name)
	if (numCalories !== undefined) {
		select(mealModalCalories('edit'))
			.clear()
			.type(String(numCalories))
	}
	select(mealModalSubmit('edit')).click()
	cy.wait('@updateMeal')
	cy.wait('@fetchMeals')
}

export function deleteMeal(name) {
	select(btnMealDelete(name)).click()
	cy.wait('@deleteMeal')
}

export function logout() {
	cy.contains('Logout').click()
}

export function loginAsUser(type) {
	cy.contains('Sign in')
	select(loginEmail()).type(`${type}@${type}.co`)
	select(loginPassword()).type('testing')
	cy.contains('button', 'Login').click()
	cy.wait('@fetchMeals')
}
