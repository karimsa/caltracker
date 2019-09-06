import React, { useState, useEffect } from 'react'
import $ from 'jquery'

import { useAsyncAction, useAsync } from '../state'
import { User } from '../models/user'
import { CreateUserModal, EditUserModal } from './user-modals'
import { isFirstLogin } from '../models/axios'

const NUM_USERS_PER_PAGE = 15
const USER_TYPES = {
	normal: 'User',
	manager: 'Manager',
	admin: 'Admin',
}

export function UserDashboard() {
	// modal refs
	const createUserModalRef = React.createRef()
	const editUserModalRef = React.createRef()

	// local state
	const [pageNumber, setPageNumber] = useState(0)
	const [userToEdit, setUserToEdit] = useState()

	// remote state
	const currentUser = useAsync(() => User.getCurrentUser())
	const [deleteUserState, deleteUserActions] = useAsyncAction(async user => {
		await User.delete(user._id)
		usersActions.fetch()
	})
	const [usersState, usersActions] = useAsyncAction(() =>
		User.get({
			$skip: pageNumber * NUM_USERS_PER_PAGE,
			$limit: NUM_USERS_PER_PAGE,
		}),
	)
	if (usersState.status === 'idle') {
		usersActions.fetch()
	}

	// side effects
	useEffect(() => {
		if (userToEdit && editUserModalRef.current) {
			$(editUserModalRef.current).modal('show')
			return () => $(editUserModalRef.current).modal('hide')
		}
	}, [userToEdit, editUserModalRef.current])

	if (usersState.error) {
		return (
			<div className="row">
				<div className="col">
					<div className="alert alert-danger">{String(usersState.error)}</div>
				</div>
			</div>
		)
	}
	if (!usersState.result) {
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
			<div className="row">
				<div className="col">
					<p className="lead mb-0">
						Welcome{isFirstLogin() ? '' : ' back'},{' '}
						<strong>{currentUser.result.data.name}</strong>!
					</p>
				</div>
				<div className="col text-right">
					<a
						href="#"
						className="btn btn-sm btn-primary"
						onClick={evt => {
							evt.preventDefault()
							$(createUserModalRef.current).modal('show')
						}}
					>
						Add user
					</a>
				</div>
			</div>

			<div className="row pt-5">
				<div className="col">
					<table className="table table-striped table-bordered">
						<thead>
							<tr>
								<th>Type</th>
								<th>Name</th>
								<th>Email</th>
								<th>Calorie Goal</th>
								<th>Actions</th>
							</tr>
						</thead>

						<tbody>
							{usersState.result.map(user => (
								<tr key={user._id}>
									<td>{USER_TYPES[user.type]}</td>
									<td>{user.name}</td>
									<td>{user.email}</td>
									<td>{user.dailyCalMax}</td>
									<th>
										<a
											href="#"
											className="btn btn-success"
											onClick={evt => {
												evt.preventDefault()
												setUserToEdit(user)
											}}
										>
											Edit
										</a>
										<a
											href="#"
											className="btn btn-danger ml-2"
											onClick={evt => {
												evt.preventDefault()
												if (
													confirm(
														`Are you sure you want to delete "${user.name}"?`,
													)
												) {
													deleteUserActions.fetch(user)
												}
											}}
										>
											Delete
										</a>
									</th>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="row">
				<div className="col">
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
									(!usersState.result ||
									usersState.result.length < NUM_USERS_PER_PAGE
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
											usersState.result &&
											usersState.result.length === NUM_USERS_PER_PAGE
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

			<CreateUserModal
				ref={createUserModalRef}
				onClose={() => usersActions.fetch()}
			/>
			{userToEdit && (
				<EditUserModal
					user={userToEdit}
					ref={editUserModalRef}
					onClose={() => {
						setUserToEdit()
						usersActions.fetch()
					}}
				/>
			)}
		</>
	)
}
