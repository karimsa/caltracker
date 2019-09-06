import $ from 'jquery'
import React, { useState, useEffect } from 'react'
import moment from 'moment'

import { CreateMealModal, EditMealModal } from './meal-modals'
import { User } from '../models/user'
import { getCurrentUserID } from '../models/axios'
import { useAsync, useAsyncAction } from '../state'
import { Meal } from '../models/meal'

const NUM_MEALS_PER_PAGE = 15

export function MealDashboard() {
	const createMealModalRef = React.createRef()
	const editMealModalRef = React.createRef()
	const currentUser = useAsync(() => User.getCurrentUser())
	const [pageNumber, setPageNumber] = useState(0)
	const [sortBy, setSortBy] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState('DESC')
	const [includeEveryone, setIncludeEveryone] = useState(false)
	const [mealToEdit, setMealToEdit] = useState()
	const [deleteMealState, deleteMealActions] = useAsyncAction(async meal => {
		await Meal.delete(meal._id)
		setPageNumber(0)
		mealListActions.fetch()
	})
	const [mealListState, mealListActions] = useAsyncAction(() => {
		const query = {
			userID: undefined,
			$skip: NUM_MEALS_PER_PAGE * pageNumber,
			$limit: NUM_MEALS_PER_PAGE,
			$sortBy: sortBy,
			$sortOrder: sortOrder,
		}
		if (!includeEveryone) {
			query.userID = getCurrentUserID()
		}
		return Meal.find(query)
	})
	useEffect(() => {
		if (mealListState.status !== 'inprogress') {
			mealListActions.fetch()
		}
		return () => mealListActions.cancel()
	}, [includeEveryone])
	useEffect(() => {
		if (mealToEdit && editMealModalRef.current) {
			$(editMealModalRef.current).modal('show')
			return () => $(editMealModalRef.current).modal('hide')
		}
	}, [mealToEdit, editMealModalRef.current])
	const isEmpty = mealListState.result && mealListState.result.length === 0
	const isAdmin = currentUser.result && currentUser.result.data.type === 'admin'

	if (currentUser.error || deleteMealState.error) {
		return (
			<div className="row">
				<div className="col">
					<div className="alert alert-danger">
						{String(currentUser.error || deleteMealState.error)}
					</div>
				</div>
			</div>
		)
	}
	if (!currentUser.result || deleteMealState.status === 'inprogress') {
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
			<div className="row pb-5 align-items-center">
				<div className="col">
					<p className="lead mb-0">
						Welcome back, <strong>{currentUser.result.data.name}</strong>!
					</p>
				</div>

				<div className="col text-right">
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

			<div className="row">
				<div className="col">
					<form className="form-inline justify-content-end">
						<label className="mr-2 font-weight-bold">Date range:</label>
						<input type="date" className="form-control" />
						<label className="mx-2">to</label>
						<input type="date" className="form-control" />

						{isAdmin && (
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
						)}
					</form>
				</div>
			</div>

			<div className="row py-3">
				<div className="col">
					{(function() {
						if (mealListState.error) {
							return (
								<div className="alert alert-danger">
									{String(mealListState.error)}
								</div>
							)
						}
						if (!mealListState.result) {
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
									{mealListState.result.map(meal => (
										<tr key={meal._id}>
											<td>{meal.name}</td>
											<td>{meal.numCalories}</td>
											<td>
												{moment(meal.createdAt).format(
													'ddd, MMM Do YYYY @ h:mm a',
												)}
											</td>
											{isAdmin && <td>{meal.userName}</td>}
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
									))}
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
