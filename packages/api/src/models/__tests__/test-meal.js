import { test, expect, createApi } from '../../testing'

test('should be able to CRUD meals', async () => {
	const api = await createApi()

	const [normal, admin] = await api.createUsers(['normal', 'admin'])

	const mealOne = await api.createMeal(normal, {
		name: 'Meal One',
		numCalories: 100,
	})
	const mealTwo = await api.createMeal(normal, {
		name: 'Meal Two',
		numCalories: 100,
	})

	{
		const meals = await api.getMeals(normal, {
			userID: normal.userID,
		})
		expect(meals[0].name).toEqual('Meal One')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[1].name).toEqual('Meal Two')
		expect(meals[1].createdAt).toBeDefined()
		expect(meals[1].createdAt).toBeGreaterThan(meals[0].createdAt)
		expect(meals).toHaveLength(2)
	}

	// should be able to update the meal as normal user
	await api.updateMeal(normal, {
		_id: mealOne._id,
		name: 'Meal One (Updated)',
	})
	{
		const meals = await api.getMeals(normal, {
			userID: normal.userID,
		})
		expect(meals[0].name).toEqual('Meal One (Updated)')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[1].name).toEqual('Meal Two')
		expect(meals[1].createdAt).toBeDefined()
		expect(meals[1].createdAt).toBeGreaterThan(meals[0].createdAt)
		expect(meals).toHaveLength(2)
	}

	// normal should not be allowed to make wildcard queries
	await expect(api.getMeals(normal)).rejects.toMatch(/not allowed/)

	{
		const meals = await api.getMeals(admin)
		expect(meals[0].name).toEqual('Meal One (Updated)')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[1].name).toEqual('Meal Two')
		expect(meals[1].createdAt).toBeDefined()
		expect(meals[1].createdAt).toBeGreaterThan(meals[0].createdAt)
		expect(meals).toHaveLength(2)
	}

	// should be able to update the meal as admin user
	await api.updateMeal(admin, {
		_id: mealOne._id,
		name: 'Meal One',
	})

	// nothing should exist for the admin himself
	expect(await api.getMeals(admin)).toHaveLength(0)

	{
		const meals = await api.getMeals(admin)
		expect(meals[0].name).toEqual('Meal One')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals[1].name).toEqual('Meal Two')
		expect(meals[1].createdAt).toBeDefined()
		expect(meals[1].createdAt).toBeGreaterThan(meals[0].createdAt)
		expect(meals).toHaveLength(2)
	}

	// should be able to delete as normal user
	await api.deleteMeal(normal, mealOne._id)

	{
		const meals = await api.getMeals(normal, {
			userID: normal.userID,
		})
		expect(meals[0].name).toEqual('Meal Two')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals).toHaveLength(1)
	}
	{
		const meals = await api.getMeals(admin)
		expect(meals[0].name).toEqual('Meal Two')
		expect(meals[0].createdAt).toBeDefined()
		expect(meals).toHaveLength(1)
	}

	// should be able to delete as admin
	await api.deleteMeal(admin, mealTwo._id)

	// db should be empty now
	expect(await api.getMeals(normal, {
		userID: normal.userID,
	})).toHaveLength(0)
	expect(await api.getMeals(admin)).toHaveLength(0)
})
