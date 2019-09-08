const clean = text => text.replace(/[^a-z0-9]+/g, '-')

export function select(dataTest) {
	return cy.get(`[data-test="${dataTest}"]`)
}

export function selectAll(prefix) {
	return cy.get(`[data-test^="${prefix}"]`)
}

// Login page
export const registerUserType = () => `register-user-type`
export const registerUserName = () => `register-user-name`
export const loginEmail = () => `login-or-register-email`
export const loginPassword = () => `login-password`
export const registerConfirmPassword = () => `register-confirm-password`
export const registerNumCalories = () => `register-num-calories`
export const btnLoginSubmit = () => `login-or-register-submit`

// Meal modals
export const btnMealEdit = name => `table-btn-edit-${clean(name)}`
export const btnMealDelete = name => `table-btn-delete-${clean(name)}`
export const editMealModal = name => `edit-meal-modal-${clean(name)}`
export const createMealModal = () => `create-meal-modal`
export const mealModalSubmit = type => `${type}-meal-modal-submit`
export const mealModalName = type => `${type}-meal-modal-name`
export const mealModalCalories = type => `${type}-meal-modal-calories`
export const mealModalCreated = type => `${type}-meal-modal-createdat`

// Meal filters
export const userCalorieGoal = () => `user-calorie-goal`
export const filterDateStart = () => `filter-date-start`
export const filterDateEnd = () => `filter-date-end`

// Meal table
export const mealRows = () => `table-meal-row`
export const btnMealRowSort = order => `meal-sort-${order}`
export const mealRowName = name => `meal-row-name-${clean(name)}`
export const mealRowCalDiff = name => `meal-row-cal-diff-${clean(name)}`
export const btnIncludeAllMeals = type => `btn-include-all-meals-${type}`
export const mealRowNumCalories = name => `meal-row-num-calories-${clean(name)}`

// Pagination
export const pageSize = () => `page-size`
export const btnNextPage = () => `pagination-next`
export const pageNumber = () => `page-number`
export const btnPrevPage = () => `pagination-prev`
