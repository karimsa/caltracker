import React from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'

import { removeAuthToken, hasAuthInfo } from '../models/axios'
import { User } from '../models/user'
import { useAsync } from '../state'
import { Navbar } from './navbar'
import { MealDashboard } from './meal-dashboard'
import { UserDashboard } from './user-dashboard'
import { NotFound } from './not-found'

export function Home() {
	const currentUser = useAsync(() => User.getCurrentUser())

	if (
		!hasAuthInfo() ||
		(currentUser.result && currentUser.result.status === 401)
	) {
		removeAuthToken()
		return <Redirect to="/login" />
	}

	if (currentUser.status === 'idle' || currentUser.status === 'inprogress') {
		return (
			<div className="h-100 d-flex align-items-center justify-content-between">
				<div className="container">
					<div className="row">
						<div className="col">
							<p className="small text-muted text-center mb-0">Loading ...</p>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (currentUser.status === 'error') {
		console.error(currentUser.error)

		return (
			<div className="h-100 d-flex align-items-center justify-content-between">
				<div className="container">
					<div className="row">
						<div className="col">
							<div className="alert alert-danger">
								Sorry, the application failed to start. Please try again later.
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<>
			<Navbar />

			<div className="container pt-5">
				<div className="row">
					<div className="col">
						<Switch>
							<Route exact path="/" component={MealDashboard} />
							<Route exact path="/users" component={UserDashboard} />
							<Route component={NotFound} />
						</Switch>
					</div>
				</div>
			</div>
		</>
	)
}
