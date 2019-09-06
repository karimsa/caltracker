import React, { useState } from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'

import { useAsyncAction } from '../state'
import { Meal } from '../models/meal'

export const CreateMealModal = React.forwardRef(({ resetMeals }, modalRef) => {
	const [mealName, setMealName] = useState('')
	const [numCalories, setNumCalories] = useState('')
	const [createMealState, createMealActions] = useAsyncAction(() => {
		return Meal.create({
			name: mealName,
			numCalories,
		}).then(async () => {
			$(modalRef.current)
				.one('hidden.bs.modal', () => {
					setMealName('')
					setNumCalories('')
				})
				.modal('hide')
			resetMeals()
		})
	})
	const isLoading = createMealState.status === 'inprogress'

	function submitForm(evt) {
		evt.preventDefault()
		createMealActions.fetch()
	}

	function closeModal(evt) {
		evt.preventDefault()
		$(modalRef.current).modal('hide')
	}

	return (
		<div
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
						<h5 className="modal-title">Add meal</h5>
						<button className="close" aria-label="Close" onClick={closeModal}>
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<div className="modal-body">
						<form className="container px-3">
							{createMealState.status === 'error' && (
								<div className="form-group row">
									<div className="alert alert-danger col">
										{String(createMealState.error)}
									</div>
								</div>
							)}
							<div className="form-group row">
								<label className="col-sm-2 col-form-label">Name</label>
								<div className="col-sm-10">
									<input
										className={'form-control ' + (mealName ? 'is-valid' : '')}
										type="text"
										placeholder="Enter the name of your meal"
										value={mealName}
										onChange={evt => setMealName(evt.target.value)}
										disabled={isLoading}
									/>
								</div>
							</div>
							<div className="form-group row">
								<label className="col-sm-2 col-form-label">Calories</label>
								<div className="col-sm-10">
									<input
										className={
											'form-control ' +
											(typeof numCalories === 'number'
												? numCalories < 1 ||
												  Math.floor(numCalories) !== numCalories ||
												  isNaN(numCalories)
													? 'is-invalid'
													: 'is-valid'
												: '')
										}
										type="number"
										placeholder="Enter the number of calories in your meal"
										min="1"
										step="1"
										value={numCalories}
										onChange={evt => setNumCalories(Number(evt.target.value))}
										disabled={isLoading}
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
							className="btn btn-primary"
							onClick={submitForm}
							disabled={
								isLoading ||
								!mealName ||
								numCalories < 1 ||
								Math.floor(numCalories) !== numCalories
							}
						>
							Add meal
						</button>
					</div>
				</div>
			</div>
		</div>
	)
})

CreateMealModal.displayName = 'CreateMealModal'
CreateMealModal.propTypes = {
	resetMeals: PropTypes.func.isRequired,
}
