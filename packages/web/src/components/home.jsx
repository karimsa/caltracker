import React from 'react'
import { Link, Redirect } from 'react-router-dom'

import { removeAuthToken, hasAuthInfo } from '../models/axios'
import { User } from '../models/user'
import { useAsync } from '../state'

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
			<nav className="navbar navbar-expand-lg navbar-dark bg-dark">
				<Link to="/" className="navbar-brand">
					CalTracker
				</Link>

				<button
					className="navbar-toggler"
					type="button"
					data-toggle="collapse"
					data-target="#navbarSupportedContent"
					aria-controls="navbarSupportedContent"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon" />
				</button>

				<div className="collapse navbar-collapse" id="navbarSupportedContent">
					<div className="navbar-nav ml-auto">
						<a className="nav-item nav-link active" href="#">
							Home
						</a>
						<a className="nav-item nav-link" href="#">
							Features
						</a>
						<Link
							className="nav-item nav-link"
							to="/"
							onClick={() => removeAuthToken()}
						>
							Logout
						</Link>
					</div>
				</div>
			</nav>

			<div className="container pt-5">
				<div className="row">
					<div className="col">
						<p className="lead">Hello, world!</p>
					</div>
				</div>
			</div>
		</>
	)
}
