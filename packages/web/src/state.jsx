import { useState, useEffect } from 'react'

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
	const [state, actions] = useAsyncAction(fn)
	if (state.status === 'idle') {
		actions.fetch()
	}
	return state
}

export function useAsyncAction(fn) {
	const [asyncArgs, setAsyncArgs] = useState()
	const [state, dispatch] = useReducer((state, action) => {
		switch (action.type) {
			case 'FETCH':
				if (state.status === 'inprogress') {
					throw new Error(`Cannot re-fetch async action that is already inprogress`)
				}
				setAsyncArgs(action.args)
				return {
					status: 'inprogress',
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
			case 'RESET':
				return {
					status: 'idle',
				}

			default:
				throw new Error(`Unexpected action received by reducer: ${action.type}`)
		}
	}, {
		status: 'idle',
	})
	useEffect(() => {
		if (asyncArgs) {
			let canceled = false
			const promise = fn(...asyncArgs)
			promise.then(result => {
				if (!canceled) {
					dispatch({ type: 'SET_RESULT', result })
				}
			}).catch(error => {
				if (!canceled) {
					dispatch({ type: 'ERROR', error })
				}
			})

			return () => {
				if (promise.cancel) {
					promise.cancel()
				}
				canceled = true
			}
		}
	}, [asyncArgs])

	return [state, {
		fetch: (...args) => dispatch({ type: 'FETCH', args }),
		forceSet: result => dispatch({ type: 'SET_RESULT', result }),
		reset: () => dispatch({ type: 'RESET' }),
		cancel: () => dispatch({ type: 'CANCEL' }),
	}]
}
