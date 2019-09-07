import React, { useState } from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import moment from 'moment'

import { useAsyncAction } from '../state'
import { Meal, MealShape } from '../models/meal'

const MealModal = React.forwardRef(
	(
		{
			title,
			actionTitle,
			remoteActions,
			remoteState,
			mealName,
			setMealName,
			numCalories,
			setNumCalories,
			createdAt,
			setCreatedAt,
			onClose,
		},
		modalRef,
	) => {
		if (remoteState.status === 'success') {
			$(modalRef.current)
				.one('hidden.bs.modal', () => {
					setMealName('')
					setNumCalories('')
					onClose()
					remoteActions.reset()
				})
				.modal('hide')
		}

		const isLoading = remoteState.status === 'inprogress'

		function submitForm(evt) {
			evt.preventDefault()
			remoteActions.fetch()
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
							<h5 className="modal-title">{title}</h5>
							<button className="close" aria-label="Close" onClick={closeModal}>
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div className="modal-body">
							<form className="container px-3">
								{remoteState.status === 'error' && (
									<div className="form-group row">
										<div className="alert alert-danger col">
											{String(remoteState.error)}
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
											type="text"
											placeholder="Enter the number of calories in your meal"
											value={String(numCalories)}
											onChange={evt => {
												const value = String(evt.target.value).replace(
													/[^0-9]/g,
													'',
												)
												if (value) {
													setNumCalories(Number(value))
												} else {
													setNumCalories('')
												}
											}}
											disabled={isLoading}
										/>
									</div>
								</div>
								<div className="form-group row">
									<div className="col-sm-2 col-form-label">Created</div>
									<div className="col-sm-10">
										<input
											type="datetime-local"
											className={
												'form-control ' +
												(String(new Date(createdAt)) === 'Invalid Date'
													? 'is-invalid'
													: 'is-valid')
											}
											onChange={evt => setCreatedAt(evt.target.value)}
											value={moment(createdAt).format('Y-MM-DD[T]HH:mm')}
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
								{actionTitle}
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	},
)

MealModal.displayName = 'MealModal'
MealModal.propTypes = {
	remoteActions: PropTypes.object.isRequired,
	remoteState: PropTypes.object.isRequired,
	mealName: PropTypes.string.isRequired,
	setMealName: PropTypes.func.isRequired,
	numCalories: PropTypes.oneOfType([
		PropTypes.string.isRequired,
		PropTypes.number.isRequired,
	]),
	setNumCalories: PropTypes.func.isRequired,
	createdAt: PropTypes.string.isRequired,
	setCreatedAt: PropTypes.func.isRequired,
	title: PropTypes.string.isRequired,
	actionTitle: PropTypes.string.isRequired,
	onClose: PropTypes.func.isRequired,
}

export const CreateMealModal = React.forwardRef(({ onClose }, modalRef) => {
	const [mealName, setMealName] = useState('')
	const [numCalories, setNumCalories] = useState('')
	const [createdAt, setCreatedAt] = useState(new Date().toUTCString())
	const [createMealState, createMealActions] = useAsyncAction(() =>
		Meal.create({
			name: mealName,
			numCalories,

			// there is no timezone information in the local time string
			// provided by the input, so we need to cast to UTC to avoid
			// serious weirdness
			createdAt: new Date(createdAt).toUTCString(),
		}),
	)

	return (
		<MealModal
			ref={modalRef}
			title="Add meal"
			actionTitle="Add"
			mealName={mealName}
			setMealName={setMealName}
			numCalories={numCalories}
			setNumCalories={setNumCalories}
			createdAt={createdAt}
			setCreatedAt={setCreatedAt}
			remoteState={createMealState}
			remoteActions={createMealActions}
			onClose={() => onClose(createMealState.result)}
		/>
	)
})

CreateMealModal.displayName = 'CreateMealModal'
CreateMealModal.propTypes = {
	onClose: PropTypes.func.isRequired,
}

export const EditMealModal = React.forwardRef(({ meal, onClose }, modalRef) => {
	const [mealName, setMealName] = useState(meal.name)
	const [numCalories, setNumCalories] = useState(meal.numCalories)
	const [createdAt, setCreatedAt] = useState(meal.createdAt)
	const [updateMealState, updateMealActions] = useAsyncAction(() =>
		Meal.update({
			_id: meal._id,
			name: mealName,
			numCalories,
			createdAt,
		}),
	)

	return (
		<MealModal
			ref={modalRef}
			title="Edit meal"
			actionTitle="Save"
			mealName={mealName}
			setMealName={setMealName}
			numCalories={numCalories}
			setNumCalories={setNumCalories}
			remoteState={updateMealState}
			remoteActions={updateMealActions}
			createdAt={createdAt}
			setCreatedAt={setCreatedAt}
			onClose={onClose}
		/>
	)
})

EditMealModal.displayName = 'EditMealModal'
EditMealModal.propTypes = {
	onClose: PropTypes.func.isRequired,
	meal: MealShape,
}
