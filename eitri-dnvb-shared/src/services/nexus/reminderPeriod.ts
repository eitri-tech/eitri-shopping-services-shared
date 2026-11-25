const DAY_MS = 24 * 60 * 60 * 1000
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const OFFSET = /^([+-])(\d{2}):(\d{2})$/

const offsetMinutesOf = (utcOffset: string): number | null => {
	const match = OFFSET.exec(utcOffset)
	if (!match) return null
	const minutes = Number(match[2]) * 60 + Number(match[3])
	return match[1] === '-' ? -minutes : minutes
}

/** Meia-noite UTC do dia local, para contar dias sem depender do fuso do aparelho. */
const localDayOf = (startedAt: string, offsetMinutes: number): number | null => {
	const date = DATE_ONLY.exec(startedAt)
	if (date) {
		const day = Date.UTC(Number(date[1]), Number(date[2]) - 1, Number(date[3]))
		return Number.isNaN(day) ? null : day
	}
	const instant = Date.parse(startedAt)
	if (Number.isNaN(instant)) return null
	return Math.floor((instant + offsetMinutes * 60 * 1000) / DAY_MS) * DAY_MS
}

/**
 * `startsAt`/`endsAt` de um lembrete a partir do `startedAt` (YYYY-MM-DD ou instante ISO) e do
 * `durationDays` da rotina: a meia-noite local do primeiro dia e a do dia seguinte ao último, no mesmo
 * cálculo que o Nexus usa ao migrar os itens antigos. `utcOffset` é o fuso da marca, hoje
 * `America/Sao_Paulo` para todas (sem horário de verão desde 2019). `null` quando `startedAt` é inválido.
 */
export const reminderPeriod = (
	startedAt: string | null | undefined,
	durationDays: number | null | undefined,
	utcOffset = '-03:00'
): { startsAt: string; endsAt: string | null } | null => {
	const offsetMinutes = offsetMinutesOf(utcOffset)
	if (offsetMinutes === null || typeof startedAt !== 'string') return null
	const day = localDayOf(startedAt.trim(), offsetMinutes)
	if (day === null) return null

	const toInstant = (localMidnight: number) => new Date(localMidnight - offsetMinutes * 60 * 1000).toISOString()
	const days = typeof durationDays === 'number' && durationDays > 0 ? Math.floor(durationDays) : null
	return {
		startsAt: toInstant(day),
		endsAt: days === null ? null : toInstant(day + days * DAY_MS)
	}
}
