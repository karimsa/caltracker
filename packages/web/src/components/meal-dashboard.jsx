import $ from 'jquery'
import React, { useState } from 'react'
import moment from 'moment'

import { CreateMealModal } from './create-meal-modal'
import { User } from '../models/user'
import { getCurrentUserID } from '../models/axios'
import { useAsync, useAsyncAction } from '../state'
import { Meal } from '../models/meal'

const NUM_MEALS_PER_PAGE = 15

export function MealDashboard() {
	const createMealModalRef = React.createRef()
	const currentUser = useAsync(() => User.getCurrentUser())
	const [pageNumber, setPageNumber] = useState(0)
	const [sortBy, setSortBy] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState('DESC')
	const [mealListState, mealListActions] = useAsyncAction(() =>
		Meal.find({
			userID: getCurrentUserID(),
			$skip: NUM_MEALS_PER_PAGE * pageNumber,
			$limit: NUM_MEALS_PER_PAGE,
			$sortBy: sortBy,
			$sortOrder: sortOrder,
		}),
	)
	if (mealListState.status === 'idle') {
		mealListActions.fetch()
	}

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

						return (
							<table className="table table-striped table-bordered table-hover">
								<thead>
									<tr>
										<th>Name</th>
										<th>Calories</th>
										<th>Date</th>
									</tr>
								</thead>

								<tbody>
									{mealListState.result.map(meal => (
										<tr key={meal._id} className="cursor-pointer">
											<td>{meal.name}</td>
											<td>{meal.numCalories}</td>
											<td>
												{moment(meal.createdAt).format(
													'ddd, MMM Do YYYY @ h:mm a',
												)}
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

			<CreateMealModal ref={createMealModalRef} />
		</>
	)
}
