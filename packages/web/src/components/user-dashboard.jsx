import React, { useState, useEffect } from 'react'
import $ from 'jquery'
import PropTypes from 'prop-types'

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

function UserRow({ user, onUserEdit, onError, onDelete }) {
	const [deleteUserState, deleteUserActions] = useAsyncAction(async user => {
		await User.delete(user._id)
		onDelete()
	})
	if (deleteUserState.error) {
		console.error(deleteUserState.error)
		onError(`Error: Failed to delete '${user.name}'`)
	}

	return (
		<tr>
			<td>{USER_TYPES[user.type]}</td>
			<td>{user.name}</td>
			<td>{user.email}</td>
			<td>{user.dailyCalMax}</td>
			<th>
				<button
					className="btn btn-success"
					disabled={deleteUserState.status === 'inprogress'}
					onClick={evt => {
						evt.preventDefault()
						onUserEdit(user)
					}}
				>
					Edit
				</button>
				<button
					className="btn btn-danger ml-2"
					disabled={deleteUserState.status === 'inprogress'}
					onClick={evt => {
						evt.preventDefault()
						if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
							deleteUserActions.fetch(user)
						}
					}}
				>
					Delete
				</button>
			</th>
		</tr>
	)
}

UserRow.propTypes = {
	user: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		email: PropTypes.string.isRequired,
		dailyCalMax: PropTypes.number.isRequired,
	}),
	onUserEdit: PropTypes.func.isRequired,
	onError: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
}

export function UserDashboard() {
	// modal refs
	const createUserModalRef = React.createRef()
	const editUserModalRef = React.createRef()

	// local state
	const [pageNumber, setPageNumber] = useState(0)
	const [userToEdit, setUserToEdit] = useState()
	const [error, setError] = useState()

	// remote state
	const currentUser = useAsync(() => User.getCurrentUser())
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
					<p className="small text-muted text-center mb-0">
						Fetching list of users ...
					</p>
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

			{error && (
				<div className="row">
					<div className="col">
						<div className="alert alert-danger">{String(error)}</div>
					</div>
				</div>
			)}

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
								<UserRow
									key={user._id}
									user={user}
									onUserEdit={setUserToEdit}
									onError={setError}
									onDelete={() => usersActions.fetch()}
								/>
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
