import React from 'react'
import { Link } from 'react-router-dom'

import { removeAuthToken } from '../models/axios'

export function Navbar() {
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
	)
}
