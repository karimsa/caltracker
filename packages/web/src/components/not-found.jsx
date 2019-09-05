import React from 'react'
import { Link } from 'react-router-dom'

export function NotFound() {
	return (
		<div className="text-center">
			<h3>Sorry, the page you are looking for does not exist.</h3>
			<Link to="/">Go to a page that exists</Link>
		</div>
	)
}
