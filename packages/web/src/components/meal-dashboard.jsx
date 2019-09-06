import $ from 'jquery'
import React, { useState, useEffect } from 'react'
import moment from 'moment'

import { CreateMealModal, EditMealModal } from './meal-modals'
import { User } from '../models/user'
import { getCurrentUserID, isFirstLogin } from '../models/axios'
import { useAsync, useAsyncAction } from '../state'
import { Meal } from '../models/meal'

const NUM_MEALS_PER_PAGE = 15
const UNIX_ONE_DAY = 1000 * 60 * 60 * 24

export function MealDashboard() {
	const createMealModalRef = React.createRef()
	const editMealModalRef = React.createRef()

	// local state
	const [calsPerDay, setCalsPerDay] = useState(new Map())
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

	// async state
	const [currentUser, currentUserActions] = useAsyncAction(async () => {
		const res = await User.getCurrentUser()
		setDailyCalMax(res.data.dailyCalMax)
		return res
	})
	if (currentUser.status === 'idle') {
		currentUserActions.fetch()
	}

	const [deleteMealState, deleteMealActions] = useAsyncAction(async meal => {
		await Meal.delete(meal._id)
		setPageNumber(0)
		mealListActions.fetch()
	})
	const [mealListState, mealListActions] = useAsyncAction(async () => {
		const query = {
			userID: undefined,
			minCreatedAt: undefined,
			maxCreatedAt: undefined,
			$skip: NUM_MEALS_PER_PAGE * pageNumber,
			$limit: NUM_MEALS_PER_PAGE,
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

		for (const key of calsPerDay.keys()) {
			calsPerDay.delete(key)
		}

		const meals = await Meal.find(query)
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
		return meals
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
	])
	useEffect(() => {
		if (mealToEdit && editMealModalRef.current) {
			$(editMealModalRef.current).modal('show')
			return () => $(editMealModalRef.current).modal('hide')
		}
	}, [mealToEdit, editMealModalRef.current])

	// computed state
	const isEmpty = mealListState.result && mealListState.result.length === 0
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
					<p className="small text-muted text-center mb-0">Loading ...</p>
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
						<p className="small text-muted text-center mb-0">Loading ...</p>
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

			{dailyCalMaxState.error && (
				<div className="row pt-3">
					<div className="col">
						<div className="alert alert-danger">
							{String(dailyCalMaxState.error)}
						</div>
					</div>
				</div>
			)}

			<div className="row pt-5">
				<div className="col">
					<form className="form-inline justify-content-between">
						<div className="d-flex flex-row">
							<label className="mr-2 font-weight-bold">Date range:</label>
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
							<label className="mx-2">to</label>
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

						<div className="d-flex flex-row">
							<label className="mr-2 font-weight-bold">Sort by:</label>
							<select
								className="form-control mr-2"
								value={sortBy}
								onChange={evt => {
									setSortBy(evt.target.value)
								}}
							>
								<option value="createdAt">Date created</option>
								<option value="updatedAt">Last updated</option>
							</select>

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
					</form>
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
						if (mealListState.error || deleteMealState.error) {
							return (
								<div className="alert alert-danger">
									{String(mealListState.error || deleteMealState.error)}
								</div>
							)
						}
						if (
							!mealListState.result ||
							deleteMealState.status === 'inprogress'
						) {
							return (
								<p className="small text-muted text-center mb-0">Loading ...</p>
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
									{mealListState.result.map(meal => {
										const calsIsOver =
											calsPerDay.get(meal.dayID) >= meal.user.dailyCalMax

										return (
											<tr key={meal._id}>
												<td>{meal.name}</td>
												<td
													className={
														'text-white bg-' +
														(calsIsOver ? 'danger' : 'success')
													}
												>
													{meal.numCalories}
												</td>
												<td>
													{moment(meal.createdAt).format(
														'ddd, MMM Do YYYY @ h:mm a',
													)}{' '}
													(
													<span
														className={
															'text-' + (calsIsOver ? 'danger' : 'success')
														}
													>
														{(calsIsOver ? '+' : '') +
															(calsPerDay.get(meal.dayID) -
																currentUser.result.data.dailyCalMax)}{' '}
														calories
													</span>
													)
												</td>
												{isAdmin && (
													<td>
														{meal.user.name} ({meal.user.dailyCalMax} calorie
														goal)
													</td>
												)}
												<td>
													<button
														className="btn btn-success"
														onClick={evt => {
															evt.preventDefault()
															setMealToEdit(meal)
														}}
													>
														Edit
													</button>
													<button
														className="btn btn-danger ml-2"
														onClick={evt => {
															evt.preventDefault()
															if (
																confirm(
																	`Are you sure you want to delete "${meal.name}"?`,
																)
															) {
																deleteMealActions.fetch(meal)
															}
														}}
													>
														Delete
													</button>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						)
					})()}
				</div>
			</div>

			<div className="row">
				<div className="col text-center">
					<nav aria-label="Page navigation example">
						<ul className="pagination justify-content-center">
							<li
								className={'page-item' + (pageNumber === 0 ? ' disabled' : '')}
							>
								<a
									className="page-link"
									aria-label="Previous"
									onClick={evt => {
										evt.preventDefault()
										if (pageNumber > 0) {
											setPageNumber(pageNumber - 1)
										}
									}}
								>
									<span aria-hidden="true">&laquo;</span>
								</a>
							</li>
							<li
								className={
									'page-item' +
									(!mealListState.result ||
									mealListState.result.length < NUM_MEALS_PER_PAGE
										? ' disabled'
										: '')
								}
							>
								<a
									className="page-link"
									aria-label="Next"
									onClick={evt => {
										evt.preventDefault()
										if (
											mealListState.result &&
											mealListState.result.length === NUM_MEALS_PER_PAGE
										) {
											setPageNumber(pageNumber + 1)
										}
									}}
								>
									<span aria-hidden="true">&raquo;</span>
								</a>
							</li>
						</ul>
					</nav>
				</div>
			</div>

			<CreateMealModal
				onClose={() => {
					setPageNumber(0)
					mealListActions.fetch()
				}}
				ref={createMealModalRef}
			/>
			{mealToEdit && (
				<EditMealModal
					meal={mealToEdit}
					onClose={() => {
						setPageNumber(0)
						setMealToEdit(null)
						mealListActions.fetch()
					}}
					ref={editMealModalRef}
				/>
			)}
		</>
	)
}
