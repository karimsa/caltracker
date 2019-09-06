import { useState } from 'react'

const kPromise = Symbol('kPromise')

// like React.useReducer() - but does not care if reducer changes
function useReducer(reducer, initialState) {
	const [state, setState] = useState(initialState)
	return [state, action => {
		const nextState = reducer(state, action)
		setState(nextState)
	}]
}

export function useAsync(fn) {
	const [state, dispatch] = useReducer((_, action) => {
		switch (action.type) {
			case 'FETCH':
				return {
					status: 'inprogress',
					result: state.result,
					promise: fn()
						.then(result => dispatch({ type: 'SET_RESULT', result }))
						.catch(error => dispatch({ type: 'ERROR', error })),
				}

			case 'SET_RESULT':
				return {
					status: 'success',
					result: action.result,
				}

			case 'ERROR':
				return {
					status: 'error',
					error: action.error,
				}

			default:
				throw new Error(`Unexpected action received by reducer: ${action.type}`)
		}
	}, {
		status: 'idle',
	})
	if (state.status === 'idle') {
		dispatch({ type: 'FETCH' })
	}
	return state
}

export function useAsyncAction(fn) {
	const [state, dispatch] = useReducer((state, action) => {
		switch (action.type) {
			case 'FETCH':
				if (state.status === 'inprogress') {
					throw new Error(`Cannot re-fetch async action that is already inprogress`)
				}
				return {
					status: 'inprogress',
					[kPromise]: fn(...action.args)
						.then(result => dispatch({ type: 'SET_RESULT', result }))
						.catch(error => dispatch({ type: 'ERROR', error })),
				}

			case 'SET_RESULT':
				return {
					status: 'success',
					result: action.result,
				}

			case 'ERROR':
				return {
					status: 'error',
					error: action.error,
				}

			case 'CANCEL':
				const promise = state[kPromise]
				if (promise && promise.cancel) {
					promise.cancel()
				}
				return {
					status: 'idle',
				}

			default:
				throw new Error(`Unexpected action received by reducer: ${action.type}`)
		}
	}, {
		status: 'idle',
	})

	return [state, {
		fetch: (...args) => dispatch({ type: 'FETCH', args }),
		cancel: () => dispatch({ type: 'CANCEL' }),
	}]
}
