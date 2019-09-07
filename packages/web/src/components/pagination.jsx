import React from 'react'
import PropTypes from 'prop-types'

export function Pagination({ remoteState, pageNumber, setPageNumber }) {
	return (
		<nav aria-label="Page navigation example">
			<ul className="pagination justify-content-center">
				<li className={'page-item' + (pageNumber === 0 ? ' disabled' : '')}>
					<a
						href="#"
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

				<li className="page-item disabled">
					<a className="page-link">Page {pageNumber + 1}</a>
				</li>

				<li
					className={
						'page-item' +
						(remoteState.result && remoteState.result.hasNextPage
							? ''
							: ' disabled')
					}
				>
					<a
						href="#"
						className="page-link"
						aria-label="Next"
						onClick={evt => {
							evt.preventDefault()
							if (remoteState.result && remoteState.result.hasNextPage) {
								setPageNumber(pageNumber + 1)
							}
						}}
					>
						<span aria-hidden="true">&raquo;</span>
					</a>
				</li>
			</ul>
		</nav>
	)
}

Pagination.propTypes = {
	remoteState: PropTypes.shape({
		result: PropTypes.shape({
			hasNextPage: PropTypes.bool.isRequired,
		}),
	}).isRequired,
	pageNumber: PropTypes.number.isRequired,
	setPageNumber: PropTypes.func.isRequired,
}
