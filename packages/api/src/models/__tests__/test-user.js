import { test, createApi } from '../../testing'

test('should allow registration and login', async () => {
	const api = await createApi()

	const [normal, manager, admin] = await api.createUsers([
		'normal',
		'manager',
		'admin',
	])

	expect((await api.getCurrentUser(normal)).type).toEqual('normal')
	expect((await api.getCurrentUser(manager)).type).toEqual('manager')
	expect((await api.getCurrentUser(admin)).type).toEqual('admin')

	// should not allow duplicates
	await expect(
		api.createUser({
			type: 'normal',
			name: 'Test User',
			email: 'test-0@example.com',
			password: 'testing',
		}),
	).rejects.toBeDefined()
})
