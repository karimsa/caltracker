import React, { useState } from 'react'
import { Redirect } from 'react-router-dom'

import { User } from '../models/user'
import { useAsyncAction } from '../state'
import { setAuthToken, setFirstLogin } from '../models/axios'
import * as DataTest from '../test'

export function isEmailValid(email) {
	const atLoc = email.indexOf('@')
	const dotLoc = email.indexOf('.')
	return (
		atLoc !== -1 && dotLoc !== -1 && dotLoc > atLoc && email.length > dotLoc + 1
	)
}

export function Login() {
	const [userType, setUserType] = useState('normal')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [dailyCalMax, setDailyCalMax] = useState(1)
	const [registerMode, setRegisterMode] = useState()
	const [loginState, loginActions] = useAsyncAction(async () => {
		if (registerMode) {
			await User.create({
				type: userType,
				name,
				email,
				password,
				dailyCalMax,
			})
			setFirstLogin()
		}

		const { userID, token } = await User.login({
			email,
			password,
		})
		setAuthToken(token, userID)
	})
	const isLoading = loginState.status === 'inprogress'

	if (loginState.status === 'success') {
		return <Redirect to="/" />
	}

	return (
		<div className="h-100 d-flex justify-content-between align-items-center bg-muted">
			<div className="container">
				<div className="row justify-content-center">
					<div className="col col-md-4">
						<form
							onSubmit={evt => {
								evt.preventDefault()
								loginActions.fetch()
							}}
						>
							<div className="form-group">
								{registerMode ? <h2>Register</h2> : <h2>Sign in</h2>}
							</div>
							{loginState.status === 'error' && (
								<div className="form-group">
									<div className="alert alert-danger">
										{String(loginState.error)}
									</div>
								</div>
							)}
							{registerMode && (
								<div className="form-group row">
									<div className="col">
										<select
											data-test={DataTest.registerUserType()}
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
							)}
							{registerMode && (
								<div className="form-group row">
									<div className="col">
										<input
											data-test={DataTest.registerUserName()}
											type="text"
											className={'form-control' + (name ? ' is-valid' : '')}
											placeholder="Full name"
											value={name}
											onChange={evt => setName(evt.target.value)}
											disabled={isLoading}
										/>
									</div>
								</div>
							)}
							<div className="form-group row">
								<div className="col">
									<input
										data-test={DataTest.loginEmail()}
										type="email"
										className={
											'form-control' +
											(email
												? isEmailValid(email)
													? ' is-valid'
													: ' is-invalid'
												: '')
										}
										placeholder="Email address"
										autoComplete="username"
										value={email}
										onChange={evt => setEmail(evt.target.value)}
										disabled={isLoading}
									/>
								</div>
							</div>
							<div className="form-group row">
								<div className="col">
									<input
										data-test={DataTest.loginPassword()}
										type="password"
										className={'form-control' + (password ? ' is-valid' : '')}
										placeholder="Password"
										autoComplete={
											registerMode ? 'new-password' : 'current-password'
										}
										value={password}
										onChange={evt => setPassword(evt.target.value)}
										disabled={isLoading}
									/>
								</div>
							</div>
							{registerMode && (
								<div className="form-group row">
									<div className="col">
										<input
											data-test={DataTest.registerConfirmPassword()}
											type="password"
											className={
												'form-control' +
												(confirmPassword
													? confirmPassword === password
														? ' is-valid'
														: ' is-invalid'
													: '')
											}
											placeholder="Confirm password"
											autoComplete="new-password"
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
							{registerMode && (
								<div className="form-group row">
									<div className="col">
										<input
											data-test={DataTest.registerNumCalories()}
											type="number"
											className="form-control"
											min="1"
											step="1"
											value={dailyCalMax}
											onChange={evt => setDailyCalMax(evt.target.value)}
											disabled={isLoading}
										/>
									</div>
								</div>
							)}
							<div className="form-group row justify-content-center">
								<div className="col-auto">
									<button
										data-test={DataTest.btnLoginSubmit()}
										type="submit"
										className="btn btn-primary"
										disabled={
											isLoading ||
											!email ||
											!password ||
											(registerMode && !confirmPassword) ||
											(registerMode && confirmPassword !== password)
										}
									>
										{registerMode ? 'Register' : 'Login'}
									</button>
								</div>
							</div>
							{!registerMode && (
								<div className="form-group row justify-content-center">
									<div className="col-auto">
										<a
											href="#"
											onClick={evt => {
												evt.preventDefault()
												loginActions.reset()
												setRegisterMode(true)
											}}
										>
											Create a new account
										</a>
									</div>
								</div>
							)}
							{registerMode && (
								<div className="form-group row justify-content-center">
									<div className="col-auto">
										<a
											href="#"
											onClick={evt => {
												evt.preventDefault()
												loginActions.reset()
												setRegisterMode(false)
											}}
										>
											I already have an account
										</a>
									</div>
								</div>
							)}
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}
