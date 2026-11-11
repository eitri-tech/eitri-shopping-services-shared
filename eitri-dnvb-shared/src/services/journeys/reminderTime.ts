import type { QuizAnswers, RoutineReminder } from '../../models/Journeys'

const MINUTES_PER_DAY = 24 * 60

/** Só HH:MM válido, normalizado com zero à esquerda: "7:5" e "24:00" voltam `null`. */
export const timeOfDay = (value: unknown): string | null => {
	const match = /^(\d{1,2}):(\d{2})$/.exec(typeof value === 'string' ? value.trim() : '')
	if (!match) return null
	const hours = Number(match[1])
	const minutes = Number(match[2])
	if (hours > 23 || minutes > 59) return null
	return `${String(hours).padStart(2, '0')}:${match[2]}`
}

const shift = (time: string, offsetMinutes: number): string => {
	const [hours, minutes] = time.split(':').map(Number)
	const total =
		(((hours * 60 + minutes + Math.round(offsetMinutes)) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
	return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * A resposta de `fromAnswer` quando existe, senão o `time` fixo, deslocados por `offsetMinutes`.
 * `null` quando não há nenhum dos dois: o horário padrão é decisão do app.
 */
export const resolveReminderTime = (
	reminder: RoutineReminder | null | undefined,
	answers: QuizAnswers | Record<string, string> | null | undefined
): string | null => {
	if (!reminder) return null
	const answered = reminder.fromAnswer ? timeOfDay(answers?.[reminder.fromAnswer]) : null
	const base = answered ?? timeOfDay(reminder.time)
	return base ? shift(base, Number.isFinite(reminder.offsetMinutes) ? reminder.offsetMinutes : 0) : null
}
