export function mem(fn) {
	let lastArg
	let lastResult
	let hasBeenCalledOnce = false

	return function(arg) {
		if (!hasBeenCalledOnce || arg !== lastArg) {
			hasBeenCalledOnce = true
			lastArg = arg
			lastResult = fn(arg)
		}

		return lastResult
	}
}
