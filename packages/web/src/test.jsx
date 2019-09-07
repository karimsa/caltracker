const clean = text => text.replace(/[^a-z0-9]+/g, '-')

export function select(dataTest) {
	return cy.get(`[data-test="${dataTest}"]`)
}

export const mealRows = () => `table-meal-row`
export const btnMealEdit = name => `table-btn-edit-${clean(name)}`
export const btnMealDelete = name => `table-btn-delete-${clean(name)}`
export const editMealModal = name => `edit-meal-modal-${clean(name)}`
export const createMealModal = () => `create-meal-modal`
export const mealModalSubmit = type => `${type}-meal-modal-submit`
export const mealModalName = type => `${type}-meal-modal-name`
export const mealModalCalories = type => `${type}-meal-modal-calories`
export const btnMealRowSort = order => `meal-sort-${order}`
export const mealRowCalDiff = name => `meal-row-cal-diff-${clean(name)}`
export const pageSize = () => `page-size`
export const btnNextPage = () => `pagination-next`
export const pageNumber = () => `page-number`
export const btnPrevPage = () => `pagination-prev`
