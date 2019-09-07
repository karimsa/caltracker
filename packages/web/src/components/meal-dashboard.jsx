import $ from 'jquery'
import React, { useState, useEffect } from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'

import { CreateMealModal, EditMealModal } from './meal-modals'
import { User } from '../models/user'
import { getCurrentUserID, isFirstLogin } from '../models/axios'
import { useAsyncAction } from '../state'
import { Meal, MealShape } from '../models/meal'
import { Pagination } from './pagination'

function MealRow({ calsPerDay, meal, isAdmin, onEdit, onDelete, onError }) {
	const [deleteMealState, deleteMealActions] = useAsyncAction(async meal => {
		await Meal.delete(meal._id)
		onDelete()
	})
	if (deleteMealState.error) {
		onError(deleteMealState.error)
	}

	const isLoading = deleteMealState.status === 'inprogress'
	const calsIsOver = calsPerDay >= meal.user.dailyCalMax

	return (
		<tr>
			<td>{meal.name}</td>
			<td className={'text-white bg-' + (calsIsOver ? 'danger' : 'success')}>
				{meal.numCalories}
			</td>
			<td>
				{moment(meal.createdAt).format('ddd, MMM Do YYYY @ h:mm a')} (
				<span className={'text-' + (calsIsOver ? 'danger' : 'success')}>
					{(calsIsOver ? '+' : '') + (calsPerDay - meal.user.dailyCalMax)}{' '}
					calories
				</span>
				)
			</td>
			{isAdmin && (
				<td>
					{meal.user.name} ({meal.user.dailyCalMax} calorie goal)
				</td>
			)}
			<td>
				<button
					className="btn btn-success"
					disabled={isLoading}
					onClick={evt => {
						evt.preventDefault()
						onEdit(meal)
					}}
				>
					Edit
				</button>
				<button
					className="btn btn-danger ml-2"
					disabled={isLoading}
					onClick={evt => {
						evt.preventDefault()
						if (confirm(`Are you sure you want to delete "${meal.name}"?`)) {
							deleteMealActions.fetch(meal)
						}
					}}
				>
					Delete
				</button>
			</td>
		</tr>
	)
}

MealRow.propTypes = {
	calsPerDay: PropTypes.number.isRequired,
	meal: MealShape,
	isAdmin: PropTypes.bool.isRequired,
	onEdit: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
	onError: PropTypes.func.isRequired,
}

function resetCalsPerDay({ calsPerDay, meals, currentUser }) {
	for (const key of calsPerDay.keys()) {
		calsPerDay.delete(key)
	}

	for (const meal of meals) {
		const day = (meal.dayID =
			meal.userID + '-' + moment(meal.createdAt).format('Y-M-D'))

		if (!meal.user) {
			meal.user = currentUser.result.data
		}

		if (calsPerDay.has(day)) {
			calsPerDay.set(day, calsPerDay.get(day) + meal.numCalories)
		} else {
			calsPerDay.set(day, meal.numCalories)
		}
	}
}

// Returns true if [a, b] is sorted correctly according
// to 'sortOrder' (only for numbers)
function itemIsGreater(sortOrder, a, b) {
	if (sortOrder === 'ASC') {
		return a <= b
	}
	return a > b
}

export function MealDashboard() {
	const createMealModalRef = React.createRef()
	const editMealModalRef = React.createRef()

	// local state
	const [calsPerDay] = useState(new Map())
	const [pageNumber, setPageNumber] = useState(0)
	const [sortBy, setSortBy] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState('DESC')
	const [filterDateStart, setFilterDateStart] = useState('')
	const [filterDateEnd, setFilterDateEnd] = useState('')
	const [filterDateStartFocus, setFilterDateStartFocus] = useState(false)
	const [filterDateEndFocus, setFilterDateEndFocus] = useState(false)
	const [includeEveryone, setIncludeEveryone] = useState(false)
	const [mealToEdit, setMealToEdit] = useState()
	const [dailyCalMax, setDailyCalMax] = useState(0)
	const [error, setError] = useState()
	const [mealsPerPage, setMealsPerPage] = useState(15)

	// async state
	const [currentUser, currentUserActions] = useAsyncAction(async () => {
		const res = await User.getCurrentUser()
		setDailyCalMax(res.data.dailyCalMax)
		return res
	})
	if (currentUser.status === 'idle') {
		currentUserActions.fetch()
	}
	const [mealListState, mealListActions] = useAsyncAction(async () => {
		const query = {
			userID: undefined,
			minCreatedAt: undefined,
			maxCreatedAt: undefined,
			$skip: mealsPerPage * pageNumber,
			$limit: mealsPerPage,
			$sortBy: sortBy,
			$sortOrder: sortOrder,
		}
		if (!includeEveryone) {
			query.userID = getCurrentUserID()
		}
		if (filterDateStart) {
			query.minCreatedAt = Number(new Date(filterDateStart))
		}
		if (filterDateEnd) {
			query.maxCreatedAt = Number(new Date(filterDateEnd))
		}

		const { meals, hasNextPage } = await Meal.find(query)
		resetCalsPerDay({ calsPerDay, meals, currentUser })
		return {
			meals,
			hasNextPage,
		}
	})
	const [dailyCalMaxState, dailyCalMaxActions] = useAsyncAction(async () => {
		await User.update({
			_id: getCurrentUserID(),
			dailyCalMax,
		})
		currentUserActions.fetch()
	})

	// side effects
	useEffect(() => {
		if (currentUser.result && mealListState.status !== 'inprogress') {
			mealListActions.fetch()
		}
		return () => mealListActions.cancel()
	}, [
		currentUser.result,
		includeEveryone,
		sortBy,
		sortOrder,
		filterDateStart,
		filterDateEnd,
		pageNumber,
	])
	useEffect(() => {
		if (mealToEdit && editMealModalRef.current) {
			$(editMealModalRef.current).modal('show')
			return () => $(editMealModalRef.current).modal('hide')
		}
	}, [mealToEdit, editMealModalRef.current])

	// computed state
	const isEmpty =
		mealListState.result && mealListState.result.meals.length === 0
	const isAdmin = currentUser.result && currentUser.result.data.type === 'admin'

	if (currentUser.error) {
		return (
			<div className="row">
				<div className="col">
					<div className="alert alert-danger">{String(currentUser.error)}</div>
				</div>
			</div>
		)
	}
	if (!currentUser.result) {
		return (
			<div className="row">
				<div className="col">
					<p className="small text-muted text-center mb-0">
						Fetching your profile ...
					</p>
				</div>
			</div>
		)
	}

	return (
		<>
			<div className="row align-items-center">
				<div className="col">
					{currentUser.result && (
						<p className="lead mb-0">
							Welcome{isFirstLogin() ? '' : ' back'},{' '}
							<strong>{currentUser.result.data.name}</strong>! Your current
							calorie intake is expected to be below{' '}
							<input
								type="number"
								className="form-control-sm form-control d-inline meal__dashboard__cal_intake"
								value={dailyCalMax}
								disabled={dailyCalMaxState.status === 'inprogress'}
								onChange={evt => setDailyCalMax(evt.target.value)}
								onBlur={() => {
									if (dailyCalMax !== currentUser.result.data.dailyCalMax) {
										dailyCalMaxActions.fetch()
									}
								}}
							/>{' '}
							calories per day.
						</p>
					)}
					{!currentUser.result && !currentUser.error && (
						<p className="small text-muted text-center mb-0">
							Fetching your profile ...
						</p>
					)}
					{currentUser.error && (
						<div className="alert alert-danger">
							{String(currentUser.error)}
						</div>
					)}
				</div>

				<div className="col-auto text-right">
					<button
						className="btn btn-sm btn-primary"
						onClick={() => {
							$(createMealModalRef.current).modal('show')
						}}
					>
						Add meal
					</button>
				</div>
			</div>

			{(dailyCalMaxState.error || error) && (
				<div className="row pt-3">
					<div className="col">
						<div className="alert alert-danger">
							{String(dailyCalMaxState.error || error)}
						</div>
					</div>
				</div>
			)}

			<div className="row pt-5">
				<div className="col">
					<div className="card">
						<div className="card-body">
							<form>
								<div className="form-group row">
									<label className="col-sm-2 font-weight-bold">
										Earliest date:
									</label>
									<div className="col-sm-10">
										<input
											type="datetime-local"
											className={
												'form-control ' +
												(filterDateStartFocus
													? filterDateStart
														? 'is-valid'
														: 'is-invalid'
													: filterDateStart
													? 'is-valid'
													: '')
											}
											value={filterDateStart}
											onChange={evt => setFilterDateStart(evt.target.value)}
											onFocus={() => setFilterDateStartFocus(true)}
											onBlur={() => setFilterDateStartFocus(false)}
										/>
									</div>
								</div>

								<div className="form-group row">
									<label className="col-sm-2 font-weight-bold">
										Latest date:
									</label>
									<div className="col-sm-10">
										<input
											type="datetime-local"
											className={
												'form-control ' +
												(filterDateEndFocus
													? filterDateEnd
														? 'is-valid'
														: 'is-invalid'
													: filterDateEnd
													? 'is-valid'
													: '')
											}
											value={filterDateEnd}
											onChange={evt => setFilterDateEnd(evt.target.value)}
											onFocus={() => setFilterDateEndFocus(true)}
											onBlur={() => setFilterDateEndFocus(false)}
										/>
									</div>
								</div>

								<div className="form-group row">
									<label className="col-sm-2 font-weight-bold">Sort by:</label>
									<div className="col-sm-10">
										<select
											className="form-control mr-2"
											value={sortBy}
											onChange={evt => {
												setSortBy(evt.target.value)
											}}
										>
											<option value="createdAt">Date created</option>
										</select>
									</div>
								</div>

								<div className="form-group row">
									<label className="col-sm-2 col-form-label font-weight-bold">
										Sort order:
									</label>
									<div className="col-sm-10">
										<div className="btn-group">
											<a
												href="#"
												className={
													'btn btn-outline-primary' +
													(sortOrder === 'ASC' ? ' active' : '')
												}
												onClick={evt => {
													evt.preventDefault()
													setSortOrder('ASC')
												}}
											>
												<i className="fas fa-arrow-alt-circle-up" />
											</a>
											<a
												href="#"
												className={
													'btn btn-outline-primary' +
													(sortOrder === 'ASC' ? '' : ' active')
												}
												onClick={evt => {
													evt.preventDefault()
													setSortOrder('DESC')
												}}
											>
												<i className="fas fa-arrow-alt-circle-down" />
											</a>
										</div>
									</div>
								</div>

								<div className="form-group row">
									<label className="col-sm-2 col-form-label font-weight-bold">
										Results per page:
									</label>
									<div className="col-sm-10">
										<input
											className="form-control"
											type="number"
											min="1"
											step="1"
											value={mealsPerPage}
											onChange={evt => setMealsPerPage(evt.target.value)}
											onBlur={() => {
												if (pageNumber === 0) {
													mealListActions.fetch()
												} else {
													setPageNumber(0)
												}
											}}
										/>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>

			{isAdmin && (
				<div className="row justify-content-end pt-3">
					<div className="col-auto">
						<div className="d-flex flex-row">
							<div className="form-check ml-2">
								<input
									className="form-check-input"
									type="checkbox"
									id="chkIncludeEveryone"
									checked={includeEveryone}
									onChange={evt => {
										setIncludeEveryone(evt.target.checked)
										setPageNumber(0)
									}}
								/>
								<label
									className="form-check-label"
									htmlFor="chkIncludeEveryone"
								>
									{"Include everyone's meals"}
								</label>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="row py-3">
				<div className="col">
					{(function() {
						if (mealListState.error) {
							return (
								<div className="p-5">
									<div className="alert alert-danger">
										{String(mealListState.error)}
									</div>
								</div>
							)
						}
						if (!mealListState.result) {
							return (
								<div className="p-5">
									<p className="small text-muted text-center mb-0">
										Fetching your meals ...
									</p>
								</div>
							)
						}

						if (isEmpty) {
							return (
								<div className="card">
									<div className="card-body">
										<h4 className="text-center p-5">
											{
												"You don't have any meals yet. Click the 'Add meal' button above to create a new meal!"
											}
										</h4>
									</div>
								</div>
							)
						}

						return (
							<table className="table table-striped table-bordered">
								<thead>
									<tr>
										<th>Name</th>
										<th>Calories</th>
										<th>Date</th>
										{isAdmin && <th>User</th>}
										<th>Actions</th>
									</tr>
								</thead>

								<tbody>
									{mealListState.result.meals.map(meal => (
										<MealRow
											key={meal._id}
											meal={meal}
											isAdmin={isAdmin}
											calsPerDay={calsPerDay.get(meal.dayID)}
											onEdit={setMealToEdit}
											onDelete={() => {
												const meals = mealListState.result.meals.filter(
													item => {
														return item !== meal
													},
												)
												resetCalsPerDay({ calsPerDay, meals, currentUser })
												mealListActions.forceSet({
													hasNextPage: mealListState.result.hasNextPage,
													meals,
												})
											}}
											onError={setError}
										/>
									))}
								</tbody>
							</table>
						)
					})()}
				</div>
			</div>

			<div className="row">
				<div className="col text-center">
					<Pagination
						remoteState={mealListState}
						pageNumber={pageNumber}
						setPageNumber={setPageNumber}
					/>
				</div>
			</div>

			<CreateMealModal
				onClose={newMeal => {
					if (newMeal) {
						newMeal.user = currentUser.result.data

						if (mealListState.result.meals.length === 0) {
							const meals = [newMeal]
							resetCalsPerDay({ calsPerDay, meals, currentUser })
							mealListActions.forceSet({
								hasNextPage: false,
								meals,
							})
						} else {
							const createdAt = Number(new Date(newMeal.createdAt))
							const firstResultCreated = Number(
								new Date(mealListState.result.meals[0].createdAt),
							)
							const lastResultCreated = Number(
								new Date(
									mealListState.result.meals[
										mealListState.result.meals.length - 1
									].createdAt,
								),
							)

							// At a bare minimum, we need to ensure that the date range for the new item
							// was not on a previous page. If it was, no insertion needs to occur.
							// If it is not, then we can insert if there is room on this page. Otherwise
							// we need to ensure that it complies to the max date range as well.
							if (itemIsGreater(sortOrder, firstResultCreated, createdAt)) {
								if (
									mealListState.result.meals.length < mealsPerPage ||
									itemIsGreater(sortOrder, createdAt, lastResultCreated)
								) {
									let hasNextPage = mealListState.result.hasNextPage
									const meals = [...mealListState.result.meals]
									let i = 0
									for (; i < meals.length; ++i) {
										const itemCreated = Number(
											new Date(mealListState.result.meals[i].createdAt),
										)
										if (itemIsGreater(sortOrder, createdAt, itemCreated)) {
											break
										}
									}
									meals.splice(i, 0, newMeal)

									if (meals.length > mealsPerPage) {
										hasNextPage = true
										meals.pop()
									}

									resetCalsPerDay({ calsPerDay, meals, currentUser })
									mealListActions.forceSet({
										hasNextPage,
										meals,
									})
								}
							} else if (pageNumber === 0) {
								let hasNextPage = mealListState.result.hasNextPage
								const meals = [newMeal, ...mealListState.result.meals]
								if (meals.length > mealsPerPage) {
									hasNextPage = true
									meals.pop()
								}

								resetCalsPerDay({ calsPerDay, meals, currentUser })
								mealListActions.forceSet({hasNextPage,meals})
							}
						}
					}
				}}
				ref={createMealModalRef}
			/>
			{mealToEdit && (
				<EditMealModal
					meal={mealToEdit}
					onClose={() => {
						setMealToEdit(null)
						mealListActions.fetch()
					}}
					ref={editMealModalRef}
				/>
			)}
		</>
	)
}
