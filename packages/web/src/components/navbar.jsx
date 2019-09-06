import React from 'react'
import { Link } from 'react-router-dom'

import { removeAuthToken } from '../models/axios'
import { User } from '../models/user'
import { useAsync } from '../state'

export function Navbar() {
	const currentUser = useAsync(() => User.getCurrentUser())

	// the dashboards take care of rendering the error, we just
	// need to hide the navbar here
	if (!currentUser.result) {
		return null
	}

	return (
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
					<Link className="nav-item nav-link" to="/">
						Meals
					</Link>
					{currentUser.result.data.type !== 'normal' && (
						<Link className="nav-item nav-link" to="/users">
							Users
						</Link>
					)}
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
	)
}
