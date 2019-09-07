import { test, expect, createApi } from '../../testing'

test.only('should be able to CRUD meals', async () => {
	const api = await createApi()

	const [normal, admin] = await api.createUsers(['normal', 'admin'])

	const mealOne = await api.createMeal(normal, {
		name: 'Meal One',
		numCalories: 100,
		createdAt: new Date().toUTCString(),
	})
	const mealTwo = await api.createMeal(normal, {
		name: 'Meal Two',
		numCalories: 100,
		createdAt: new Date(Date.now() + 10000).toUTCString(),
	})

	// should not allow invalid meals to be created
	await expect(api.createMeal(normal)).rejects.toThrow(/not provided/)
	await expect(
		api.createMeal(normal, {
			name: 'test',
		}),
	).rejects.toThrow(/not provided/)
	await expect(
		api.createMeal(normal, {
			numCalories: 100,
		}),
	).rejects.toThrow(/not provided/)

	// empty strings are not valid strings
	await expect(
		api.createMeal(normal, {
			name: '',
			numCalories: 100,
		}),
	).rejects.toThrow(/not provided/)

	// invalid calories are also not allowed
	await expect(
		api.createMeal(normal, {
			name: 'test',
			numCalories: 0,
			createdAt: new Date().toUTCString(),
		}),
	).rejects.toThrow(/valid/)
	await expect(
		api.createMeal(normal, {
			name: 'test',
			numCalories: -1,
			createdAt: new Date().toUTCString(),
		}),
	).rejects.toThrow(/valid/)
	await expect(
		api.createMeal(normal, {
			name: 'test',
			numCalories: Math.PI,
			createdAt: new Date().toUTCString(),
		}),
	).rejects.toThrow(/valid/)

	{
		const { meals } = await api.getMeals(normal, {
			userID: normal.userID,
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})
		expect(meals[0].name).toEqual('Meal One')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[0].user).not.toBeDefined()
		expect(meals[0].caloriesForDay).toEqual(200)
		expect(meals[1].name).toEqual('Meal Two')
		expect(meals[1].createdAt).toBeDefined()
		expect(meals[1].user).not.toBeDefined()
		expect(meals[1].caloriesForDay).toEqual(200)
		expect(Number(new Date(meals[1].createdAt))).toBeGreaterThan(
			Number(new Date(meals[0].createdAt)),
		)
		expect(meals).toHaveLength(2)
	}

	// should sort correctly
	{
		const { meals } = await api.getMeals(normal, {
			userID: normal.userID,
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'DESC',
		})
		expect(meals[0].name).toEqual('Meal Two')
		expect(meals[1].name).toEqual('Meal One')
		expect(meals).toHaveLength(2)
	}

	// should filter correctly
	{
		const { meals } = await api.getMeals(normal, {
			userID: normal.userID,
			minCreatedAt: Number(new Date(mealOne.createdAt)) + 1,
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})
		expect(meals[0].name).toEqual('Meal Two')
		expect(meals[0].caloriesForDay).toEqual(200)
		expect(meals).toHaveLength(1)
	}

	// should be able to update the meal as normal user
	const updatedMeal = await api.updateMeal(normal, {
		_id: mealOne._id,
		name: 'Meal One (Updated)',
	})
	expect(updatedMeal).toBeDefined()
	expect(updatedMeal.name).toEqual('Meal One (Updated)')

	{
		const { meals } = await api.getMeals(normal, {
			userID: normal.userID,
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})
		expect(meals[0].name).toEqual('Meal One (Updated)')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[0].user).not.toBeDefined()
		expect(meals[0].caloriesForDay).toEqual(200)
		expect(meals[1].name).toEqual('Meal Two')
		expect(meals[1].createdAt).toBeDefined()
		expect(meals[1].user).not.toBeDefined()
		expect(meals[1].caloriesForDay).toEqual(200)
		expect(Number(new Date(meals[1].createdAt))).toBeGreaterThan(
			Number(new Date(meals[0].createdAt)),
		)
		expect(meals).toHaveLength(2)
	}

	// normal should not be allowed to make wildcard queries
	await expect(
		api.getMeals(normal, {
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		}),
	).rejects.toThrow(/not allowed/)

	{
		const { meals } = await api.getMeals(admin, {
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})
		expect(meals[0].name).toEqual('Meal One (Updated)')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[0].user.name).toBeDefined()
		expect(meals[0].caloriesForDay).toEqual(200)
		expect(meals[1].name).toEqual('Meal Two')
		expect(meals[1].createdAt).toBeDefined()
		expect(meals[1].user.name).toBeDefined()
		expect(meals[1].caloriesForDay).toEqual(200)
		expect(Number(new Date(meals[1].createdAt))).toBeGreaterThan(
			Number(new Date(meals[0].createdAt)),
		)
		expect(meals).toHaveLength(2)
	}

	// should be able to update the meal as admin user
	await api.updateMeal(admin, {
		_id: mealOne._id,
		name: 'Meal One',
	})

	// nothing should exist for the admin himself
	expect(
		(await api.getMeals(admin, {
			userID: admin.userID,
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})).meals,
	).toHaveLength(0)

	{
		const { meals } = await api.getMeals(admin, {
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})
		expect(meals[0].name).toEqual('Meal One')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[0].user.name).toBeDefined()
		expect(meals[0].caloriesForDay).toEqual(200)
		expect(meals[1].name).toEqual('Meal Two')
		expect(meals[1].createdAt).toBeDefined()
		expect(meals[1].user.name).toBeDefined()
		expect(meals[1].caloriesForDay).toEqual(200)
		expect(Number(new Date(meals[1].createdAt))).toBeGreaterThan(
			Number(new Date(meals[0].createdAt)),
		)
		expect(meals).toHaveLength(2)
	}

	// should be able to delete as normal user
	await api.deleteMeal(normal, mealOne._id)

	{
		const { meals } = await api.getMeals(normal, {
			userID: normal.userID,
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})
		expect(meals[0].name).toEqual('Meal Two')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[0].user).not.toBeDefined()
		expect(meals[0].caloriesForDay).toEqual(100)
		expect(meals).toHaveLength(1)
	}
	{
		const { meals } = await api.getMeals(admin, {
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})
		expect(meals[0].name).toEqual('Meal Two')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[0].user.name).toBeDefined()
		expect(meals[0].caloriesForDay).toEqual(100)
		expect(meals).toHaveLength(1)
	}

	// should be able to delete as admin
	await api.deleteMeal(admin, mealTwo._id)

	// db should be empty now
	expect(
		(await api.getMeals(normal, {
			userID: normal.userID,
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})).meals,
	).toHaveLength(0)
	expect(
		(await api.getMeals(admin, {
			$skip: 0,
			$limit: 10,
			$sortBy: 'createdAt',
			$sortOrder: 'ASC',
		})).meals,
	).toHaveLength(0)
}, 1e5)
