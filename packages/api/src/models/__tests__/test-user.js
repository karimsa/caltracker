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
			dailyCalMax: 100,
		}),
	).rejects.toThrow(/already exists/)
}, 1e5)

test('should only allow user management for admins', async () => {
	const api = await createApi()

	const ALL_USERS = { $skip: 0, $limit: 100 }
	const [normal, manager, admin] = await api.createUsers([
		'normal',
		'manager',
		'admin',
	])

	await expect(api.getUsers(normal, ALL_USERS)).rejects.toThrow(/not allowed/)

	function userString(users) {
		return users
			.map(user => user.type)
			.sort()
			.join('-')
	}

	{
		const users = await api.getUsers(manager, ALL_USERS)
		expect(userString(users)).toEqual('admin-manager-normal')
		expect(users).toHaveLength(3)
	}
	{
		const users = await api.getUsers(admin, ALL_USERS)
		expect(userString(users)).toEqual('admin-manager-normal')
		expect(users).toHaveLength(3)
	}

	// manager can update
	await api.updateUser(manager, {
		_id: normal.userID,
		name: 'Norman the Normal',
	})
	expect((await api.getCurrentUser(normal)).name).toEqual('Norman the Normal')

	// admin can update
	await api.updateUser(admin, {
		_id: normal.userID,
		name: 'Norman the Abnormal',
	})
	expect((await api.getCurrentUser(normal)).name).toEqual('Norman the Abnormal')

	// manager can delete
	await api.deleteUser(manager, {
		_id: normal.userID,
	})

	{
		const users = await api.getUsers(manager, ALL_USERS)
		expect(userString(users)).toEqual('admin-manager')
		expect(users).toHaveLength(2)
	}
	{
		const users = await api.getUsers(admin, ALL_USERS)
		expect(userString(users)).toEqual('admin-manager')
		expect(users).toHaveLength(2)
	}

	// admin can delete
	await api.deleteUser(admin, {
		_id: manager.userID,
	})
	{
		const users = await api.getUsers(admin, ALL_USERS)
		expect(userString(users)).toEqual('admin')
		expect(users).toHaveLength(1)
	}
}, 1e5)
