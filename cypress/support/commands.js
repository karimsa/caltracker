import moment from 'moment'

// setDate - sets the value of a datetime-local input
Cypress.Commands.add('setDate', { prevSubject: true }, (input, value) => {
	for (const elm of input) {
		elm.dispatchEvent(new Event('focus', { bubbles: true }))
		Object.getOwnPropertyDescriptor(
			window.HTMLInputElement.prototype,
			'value',
		).set.call(elm, moment(value).format('Y-MM-DD[T]HH:mm'))
		elm.dispatchEvent(new Event('input', { bubbles: true }))
		elm.dispatchEvent(new Event('blur', { bubbles: true }))
	}
})
