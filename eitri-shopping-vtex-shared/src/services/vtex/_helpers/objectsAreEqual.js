export default function objectsAreEqual (obj1, obj2) {
	if (obj1 === obj2) return true

	const keys1 = Object.keys(obj1)
	const keys2 = Object.keys(obj2)

	if (keys1.length !== keys2.length) return false

	return keys1.every(key => {
		const val1 = obj1[key]
		const val2 = obj2[key]

		if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
			return objectsAreEqual(val1, val2)
		}

		return val1 === val2
	})
}