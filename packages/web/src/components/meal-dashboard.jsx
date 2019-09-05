import $ from 'jquery'
import React from 'react'

import { CreateMealModal } from './create-meal-modal'
import { User } from '../models/user'
import { useAsync } from '../state'

export function MealDashboard() {
	const createMealModalRef = React.createRef()
	const currentUser = useAsync(() => User.getCurrentUser())

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
					<table className="table table-striped table-bordered table-hover">
						<thead>
							<tr>
								<th>Name</th>
								<th>Calories</th>
								<th>Date</th>
							</tr>
						</thead>

						<tbody>
							<tr className="cursor-pointer">
								<td>Test meal</td>
								<td>100</td>
								<td>Some day</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<CreateMealModal ref={createMealModalRef} />
		</>
	)
}
