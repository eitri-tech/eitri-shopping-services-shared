export default function isVersionGreater(current, base) {
	try {
		const curr = current.split('.').map(Number)
		const baseV = base.split('.').map(Number)

		for (let i = 0; i < Math.max(curr.length, baseV.length); i++) {
			const a = curr[i] || 0
			const b = baseV[i] || 0
			if (a > b) return true
			if (a < b) return false
		}
		return false
	} catch (e) {
		console.log("Error on isVersionGreater")
		return false
	}
}