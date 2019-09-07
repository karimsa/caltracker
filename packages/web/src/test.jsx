const clean = text => text.replace(/[^a-z]+/g, '-')

export function select(dataTest) {
	return cy.get(`[data-test="${dataTest}"]`)
}

export const btnMealEdit = name => `table-btn-edit-${clean(name)}`
export const btnMealDelete = name => `table-btn-delete-${clean(name)}`
export const editMealModal = name => `edit-meal-modal-${clean(name)}`
export const createMealModal = () => `create-meal-modal`
export const mealModalSubmit = type => `${type}-meal-modal-submit`
export const mealModalName = type => `${type}-meal-modal-name`
export const mealModalCalories = type => `${type}-meal-modal-calories`
