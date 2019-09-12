import React, { useState } from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'

import { useAsyncAction } from '../state'
import { User } from '../models/user'
import { isEmailValid } from './login'
import * as DataTest from '../test'

const UserModal = React.forwardRef(
	(
		{
			modalType,
			remoteState,
			remoteActions,
			userType,
			setUserType,
			userName,
			setUserName,
			email,
			setEmail,
			password,
			setPassword,
			dailyCalMax,
			setDailyCalMax,
			onClose,
		},
		modalRef,
	) => {
		const [confirmPassword, setConfirmPassword] = useState('')

		if (remoteState.status === 'success') {
			$(modalRef.current)
				.one('hidden.bs.modal', () => {
					setUserName('')
					setEmail('')
					onClose()
				})
				.modal('hide')
		}

		const isLoading = remoteState.status === 'inprogress'
		const isFormValid =
			!isLoading &&
			userName &&
			email &&
			dailyCalMax > 0 &&
			Math.floor(dailyCalMax) === dailyCalMax &&
			(modalType === 'add'
				? password && password === confirmPassword
				: !password || password === confirmPassword)

		function submitForm(evt) {
			evt.preventDefault()
			if (isFormValid) {
				remoteActions.fetch()
			}
		}

		function closeModal(evt) {
			evt.preventDefault()
			$(modalRef.current).modal('hide')
		}

		return (
			<div
				data-test={
					DataTest.modalUser(modalType)
				}
				className="modal fade"
				tabIndex="-1"
				role="dialog"
				data-backdrop="static"
				data-keyboard="false"
				ref={modalRef}
			>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">
								{modalType === 'add' ? 'Add user' : 'Edit user'}
							</h5>
							<button className="close" aria-label="Close" onClick={closeModal}>
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div className="modal-body">
							<form className="container px-3" onSubmit={submitForm}>
								{remoteState.status === 'error' && (
									<div className="form-group row">
										<div className="alert alert-danger col">
											{String(remoteState.error)}
										</div>
									</div>
								)}
								<div className="form-group row">
									<div className="col">
										<select
											data-test={DataTest.modalUserType(modalType)}
											className="form-control"
											value={userType}
											onChange={evt => setUserType(evt.target.value)}
										>
											<option value="normal">Regular user</option>
											<option value="manager">User manager</option>
											<option value="admin">Admin user</option>
										</select>
									</div>
								</div>
								<div className="form-group row">
									<div className="col">
										<input
											className={'form-control ' + (userName ? 'is-valid' : '')}
											type="text"
											placeholder="Enter the name of your user"
											value={userName}
											onChange={evt => setUserName(evt.target.value)}
											disabled={isLoading}
										/>
									</div>
								</div>
								<div className="form-group row">
									<div className="col">
										<input
											className={
												'form-control ' +
												(email
													? isEmailValid(email)
														? 'is-valid'
														: 'is-invalid'
													: '')
											}
											type="email"
											placeholder="Enter an email address"
											value={email}
											onChange={evt => setEmail(evt.target.value)}
											disabled={isLoading}
										/>
									</div>
								</div>
								<div className="form-group row">
									<div className="col">
										<input
											className={'form-control ' + (password ? 'is-valid' : '')}
											type="password"
											placeholder={
												modalType === 'add'
													? 'Password'
													: 'Enter a password to change it'
											}
											value={password}
											onChange={evt => setPassword(evt.target.value)}
											disabled={isLoading}
										/>
									</div>
								</div>
								{(modalType === 'add' || password) && (
									<div className="form-group row">
										<div className="col">
											<input
												className={
													'form-control ' +
													(confirmPassword
														? confirmPassword === password
															? 'is-valid'
															: 'is-invalid'
														: '')
												}
												type="password"
												placeholder="Confirm your password"
												value={confirmPassword}
												onChange={evt => setConfirmPassword(evt.target.value)}
												disabled={isLoading}
											/>
											<div className="invalid-feedback">
												{"Passwords don't match."}
											</div>
										</div>
									</div>
								)}
								<div className="form-group row mb-0">
									<div className="col">
										<input
											type="number"
											min="1"
											step="1"
											placeholder="Enter the max number of calories per day"
											className={
												'form-control ' +
												(dailyCalMax
													? dailyCalMax < 1 ||
													  Math.floor(dailyCalMax) !== dailyCalMax
														? 'is-invalid'
														: 'is-valid'
													: '')
											}
											onChange={evt => setDailyCalMax(Number(evt.target.value))}
											value={dailyCalMax}
										/>
									</div>
								</div>
							</form>
						</div>
						<div className="modal-footer">
							<button
								className="btn btn-secondary"
								disabled={isLoading}
								// Using a manual close button so that if the modal close
								// is attempted when we are in a loading state, it is ignored
								onClick={closeModal}
							>
								Close
							</button>
							<button
								data-test={DataTest.modalUserSubmit(modalType)}
								className="btn btn-primary"
								onClick={submitForm}
								disabled={!isFormValid}
							>
								{modalType === 'add' ? 'Add' : 'Save'}
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	},
)

UserModal.displayName = 'UserModal'
UserModal.propTypes = {
	remoteActions: PropTypes.object.isRequired,
	remoteState: PropTypes.object.isRequired,
	userType: PropTypes.string.isRequired,
	setUserType: PropTypes.func.isRequired,
	userName: PropTypes.string.isRequired,
	setUserName: PropTypes.func.isRequired,
	email: PropTypes.string.isRequired,
	setEmail: PropTypes.func.isRequired,
	password: PropTypes.string.isRequired,
	setPassword: PropTypes.func.isRequired,
	dailyCalMax: PropTypes.oneOfType([
		PropTypes.string.isRequired,
		PropTypes.number.isRequired,
	]),
	setDailyCalMax: PropTypes.func.isRequired,
	modalType: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
}

export const CreateUserModal = React.forwardRef(({ onClose }, modalRef) => {
	const [userType, setUserType] = useState('normal')
	const [userName, setUserName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [dailyCalMax, setDailyCalMax] = useState('')
	const [createUserState, createUserActions] = useAsyncAction(() =>
		User.create({
			type: userType,
			name: userName,
			email,
			password,
			dailyCalMax,
		}),
	)

	return (
		<UserModal
			ref={modalRef}
			modalType="add"
			userType={userType}
			setUserType={setUserType}
			userName={userName}
			setUserName={setUserName}
			email={email}
			setEmail={setEmail}
			password={password}
			setPassword={setPassword}
			dailyCalMax={dailyCalMax}
			setDailyCalMax={setDailyCalMax}
			remoteState={createUserState}
			remoteActions={createUserActions}
			onClose={onClose}
		/>
	)
})

CreateUserModal.displayName = 'CreateUserModal'
CreateUserModal.propTypes = {
	onClose: PropTypes.func.isRequired,
}

export const EditUserModal = React.forwardRef(({ user, onClose }, modalRef) => {
	const [userType, setUserType] = useState(user.type)
	const [userName, setUserName] = useState(user.name)
	const [email, setEmail] = useState(user.email)
	const [password, setPassword] = useState('')
	const [dailyCalMax, setDailyCalMax] = useState(user.dailyCalMax)
	const [updateUserState, updateUserActions] = useAsyncAction(() => {
		const updates = {
			_id: user._id,
			type: userType,
			name: userName,
			email,
			password: undefined,
			dailyCalMax,
		}
		if (password) {
			updates.password = password
		}
		return User.update(updates)
	})

	return (
		<UserModal
			ref={modalRef}
			modalType="edit"
			userType={userType}
			setUserType={setUserType}
			userName={userName}
			setUserName={setUserName}
			email={email}
			setEmail={setEmail}
			password={password}
			setPassword={setPassword}
			remoteState={updateUserState}
			remoteActions={updateUserActions}
			dailyCalMax={dailyCalMax}
			setDailyCalMax={setDailyCalMax}
			onClose={onClose}
		/>
	)
})

EditUserModal.displayName = 'EditUserModal'
EditUserModal.propTypes = {
	onClose: PropTypes.func.isRequired,
	user: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		email: PropTypes.string.isRequired,
		dailyCalMax: PropTypes.number.isRequired,
	}).isRequired,
}
