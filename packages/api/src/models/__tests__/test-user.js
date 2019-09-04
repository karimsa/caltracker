import { test, createApi } from '../../testing'

test('should allow registration and login', async () => {
	const api = await createApi()

	await api.createUser({
		type: 'normal',
		name: 'Test User',
		email: 'test-0@example.com',
		password: 'testing',
	})

	await api.createUser({
		type: 'manager',
		name: 'Test User',
		email: 'test-0@example.com',
		password: 'testing',
	})

	await api.createUser({
		type: 'admin',
		name: 'Test User',
		email: 'test-0@example.com',
		password: 'testing',
	})
})
