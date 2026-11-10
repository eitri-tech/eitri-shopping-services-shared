import type { CmsImage, CmsSection } from '../../models/Cms'
import type {
	OutcomeCondition,
	OutcomeOperator,
	OutcomeProduct,
	Quiz,
	QuizBlock,
	QuizCompletion,
	QuizCta,
	QuizOption,
	QuizOutcome,
	QuizSummary,
	Routine,
	RoutineCheckin,
	RoutineMilestone,
	RoutineProduct,
	RoutineReminder,
	RoutineStep,
	ScalePoint,
	TimeSlot
} from '../../models/Journeys'
import { isObject } from '../_helpers/http'
import { timeOfDay } from './reminderTime'

/**
 * O payload do CMS é a fronteira de confiança: aqui `null` vira `undefined`/`[]`, item malformado
 * some e seção desabilitada não chega ao app.
 */

const text = (value: unknown): string | undefined => {
	if (typeof value !== 'string') return undefined
	const trimmed = value.trim()
	return trimmed.length ? trimmed : undefined
}

const idText = (value: unknown): string | undefined =>
	typeof value === 'number' && Number.isFinite(value) ? String(value) : text(value)

const num = (value: unknown, fallback: number): number => {
	const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN
	return Number.isFinite(parsed) ? parsed : fallback
}

const optionalNum = (value: unknown): number | undefined => {
	const parsed = num(value, NaN)
	return Number.isFinite(parsed) ? parsed : undefined
}

const list = <T>(value: unknown, map: (item: Record<string, any>, index: number) => T | null): T[] =>
	(Array.isArray(value) ? value : [])
		.map((item, index) => (isObject(item) ? map(item, index) : null))
		.filter((item): item is T => item !== null)

const strings = (value: unknown): string[] =>
	(Array.isArray(value) ? value : []).map(idText).filter((item): item is string => !!item)

const idOf = (raw: Record<string, any>, fallback: string): string => idText(raw.id) ?? fallback

/** A API resolve `media` para `{ url, alt, width, height }`; id solto (mídia apagada) vira `undefined`. */
const image = (raw: unknown): CmsImage | undefined => {
	if (!isObject(raw)) return undefined
	const url = text(raw.url)
	if (!url) return undefined
	return { url, alt: text(raw.alt) ?? '', width: optionalNum(raw.width), height: optionalNum(raw.height) }
}

/** Referência (`x-ref`) resolvida vem como objeto; sem resolver, como id. */
const refSlug = (raw: unknown): string | undefined => (isObject(raw) ? text(raw.slug) : text(raw))

const routineProduct = (raw: Record<string, any>, i: number): RoutineProduct | null => {
	const productId = idText(raw.productId)
	if (!productId) return null
	return { id: idOf(raw, `product-${i}`), productId, role: text(raw.role) ?? 'main', dose: text(raw.dose) }
}

const routineStep = (raw: Record<string, any>, i: number): RoutineStep | null => {
	const title = text(raw.title)
	if (!title) return null
	return {
		id: idOf(raw, `step-${i}`),
		title,
		description: text(raw.description),
		period: text(raw.period) ?? 'any',
		productId: idText(raw.productId)
	}
}

const milestone = (raw: Record<string, any>, i: number): RoutineMilestone | null => {
	const title = text(raw.title)
	const day = num(raw.day, NaN)
	if (!title || !Number.isFinite(day)) return null
	return { id: idOf(raw, `milestone-${i}`), day, title, description: text(raw.description) }
}

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const weekday = (value: unknown): number | null => {
	if (typeof value === 'number') return Number.isInteger(value) && value >= 0 && value <= 6 ? value : null
	const index = WEEKDAYS.indexOf(String(value ?? '').toLowerCase())
	return index >= 0 ? index : null
}

const reminder = (raw: Record<string, any>, i: number): RoutineReminder | null => {
	const time = timeOfDay(raw.time) ?? undefined
	const fromAnswer = text(raw.fromAnswer)
	if (!time && !fromAnswer) return null
	return {
		id: idOf(raw, `reminder-${i}`),
		...(time ? { time } : {}),
		...(fromAnswer ? { fromAnswer } : {}),
		offsetMinutes: num(raw.offsetMinutes, 0),
		repeatEveryMinutes: optionalNum(raw.repeatEveryMinutes),
		repeatTimes: optionalNum(raw.repeatTimes),
		days: (Array.isArray(raw.days) ? raw.days : []).map(weekday).filter((day): day is number => day !== null),
		channel: text(raw.channel) ?? 'push'
	}
}

const checkin = (raw: unknown): RoutineCheckin | null => {
	if (!isObject(raw)) return null
	const quiz = refSlug(raw.quiz)
	return quiz ? { quiz, everyDays: Math.max(1, num(raw.everyDays, 7)) } : null
}

const sections = (raw: unknown): CmsSection[] =>
	list(raw, item => {
		const blockType = text(item.blockType)
		return blockType && item._enabled !== false ? ({ ...item, blockType } as CmsSection) : null
	})

const sectionItems = (all: CmsSection[], blockType: string): unknown[] => {
	const items = all.find(section => section.blockType === blockType)?.items
	return Array.isArray(items) ? items : []
}

const durationDays = (value: unknown): number | null => {
	const days = num(value, NaN)
	return Number.isFinite(days) && days >= 1 ? Math.floor(days) : null
}

export const normalizeRoutine = (raw: unknown): Routine | null => {
	if (!isObject(raw)) return null
	const slug = text(raw.slug)
	const name = text(raw.name)
	if (!slug || !name) return null
	const enabled = sections(raw.sections)
	return {
		id: idOf(raw, slug),
		slug,
		name,
		durationDays: durationDays(raw.durationDays),
		summary: text(raw.summary),
		products: list(raw.products, routineProduct),
		steps: list(sectionItems(enabled, 'Steps'), routineStep),
		milestones: list(sectionItems(enabled, 'Milestones'), milestone).sort((a, b) => a.day - b.day),
		highlights: strings(sectionItems(enabled, 'Highlights')),
		reminders: list(raw.reminders, reminder),
		checkin: checkin(raw.checkin),
		sections: enabled,
		updatedAt: text(raw.updatedAt)
	}
}

const option = (raw: Record<string, any>, i: number): QuizOption | null => {
	const value = idText(raw.value)
	const label = text(raw.label)
	if (!value || !label) return null
	const result = isObject(raw.result) ? raw.result : {}
	return {
		id: idOf(raw, `option-${i}`),
		value,
		label,
		description: text(raw.description),
		accentColor: text(raw.accentColor),
		image: image(raw.image),
		result: { routine: normalizeRoutine(result.routine), products: strings(result.products) }
	}
}

const timeSlot = (raw: Record<string, any>, i: number): TimeSlot | null => {
	const value = timeOfDay(raw.value)
	if (!value) return null
	return { id: idOf(raw, `slot-${i}`), value, label: text(raw.label), hint: text(raw.hint) }
}

const scalePoint = (raw: Record<string, any>): ScalePoint | null => {
	const value = num(raw.value, NaN)
	const label = text(raw.label)
	return Number.isFinite(value) && label ? { value, label } : null
}

const block = (raw: Record<string, any>, i: number): QuizBlock | null => {
	if (raw.enabled === false || raw._enabled === false) return null
	const key = text(raw.key)
	const blockType = text(raw.blockType)
	if (!key || !blockType) return null
	const base = {
		id: idOf(raw, `block-${i}`),
		key,
		label: text(raw.label) ?? '',
		helpText: text(raw.helpText),
		required: raw.required !== false
	}
	switch (blockType) {
		case 'choice': {
			const options = list(raw.options, option)
			if (!options.length) return null
			return {
				...base,
				blockType,
				layout: text(raw.layout),
				columns: optionalNum(raw.columns),
				multiple: raw.multiple === true,
				maxSelections: optionalNum(raw.maxSelections),
				options
			}
		}
		case 'scale': {
			const min = num(raw.min, 1)
			const max = num(raw.max, 5)
			if (max <= min) return null
			return {
				...base,
				blockType,
				layout: text(raw.layout) ?? 'buttons',
				min,
				max,
				step: Math.max(1, num(raw.step, 1)),
				minLabel: text(raw.minLabel),
				maxLabel: text(raw.maxLabel),
				points: list(raw.points, scalePoint).filter(point => point.value >= min && point.value <= max)
			}
		}
		case 'photo':
			return { ...base, blockType, guidance: text(raw.guidance), compareWith: text(raw.compareWith) ?? 'first' }
		case 'time': {
			const slots = list(raw.slots, timeSlot)
			const layout = text(raw.layout) ?? 'picker'
			return { ...base, blockType, layout: layout === 'slots' && !slots.length ? 'picker' : layout, slots }
		}
		case 'consent':
			return { ...base, blockType, permission: text(raw.permission), defaultValue: raw.defaultValue === true }
		case 'text':
			return {
				...base,
				blockType,
				multiline: raw.multiline === true,
				placeholder: text(raw.placeholder),
				maxLength: optionalNum(raw.maxLength)
			}
		default:
			return { ...raw, ...base, blockType } as QuizBlock
	}
}

const cta = (raw: Record<string, any>, i: number): QuizCta | null => {
	const label = text(raw.label)
	const action = text(raw.action)
	if (!label || !action) return null
	return { id: idOf(raw, `cta-${i}`), label, action, target: idText(raw.target), style: text(raw.style) ?? 'primary' }
}

const completion = (raw: unknown): QuizCompletion | null => {
	if (!isObject(raw)) return null
	return {
		display: text(raw.display) ?? 'inline-card',
		eyebrow: text(raw.eyebrow),
		heading: text(raw.heading),
		body: text(raw.body),
		ctas: list(raw.ctas, cta)
	}
}

const OPERATORS: OutcomeOperator[] = ['equals', 'in', 'gte', 'lte']

const condition = (raw: Record<string, any>): OutcomeCondition | null => {
	const question = text(raw.question)
	const operator = (text(raw.operator) ?? 'equals') as OutcomeOperator
	const values = strings(raw.values)
	if (!question || !OPERATORS.includes(operator) || !values.length) return null
	return { question, operator, values }
}

const outcomeProduct = (raw: Record<string, any>): OutcomeProduct | null => {
	const productId = idText(raw.productId)
	return productId ? { productId, reason: text(raw.reason) } : null
}

/** Regra com condição malformada sai inteira: aplicá-la só com as condições válidas casaria a mais. */
const outcome = (raw: Record<string, any>, i: number): QuizOutcome | null => {
	const rawConditions = Array.isArray(raw.conditions) ? raw.conditions : []
	const conditions = list(rawConditions, condition)
	if (!conditions.length || conditions.length !== rawConditions.length) return null
	const copy = isObject(raw.copyOverrides) ? raw.copyOverrides : {}
	return {
		id: idOf(raw, `outcome-${i}`),
		label: text(raw.label) ?? '',
		conditions,
		routine: normalizeRoutine(raw.routine),
		extraProducts: list(raw.extraProducts, outcomeProduct),
		copyOverrides: { eyebrow: text(copy.eyebrow), heading: text(copy.heading), body: text(copy.body) }
	}
}

export const normalizeQuiz = (raw: unknown): Quiz | null => {
	if (!isObject(raw)) return null
	const slug = text(raw.slug)
	if (!slug) return null
	const header = isObject(raw.header) ? raw.header : {}
	return {
		id: idOf(raw, slug),
		slug,
		title: text(raw.title) ?? '',
		kind: text(raw.kind) ?? 'onboarding',
		presentation: text(raw.presentation) ?? 'single-page',
		header: { eyebrow: text(header.eyebrow), heading: text(header.heading), subheading: text(header.subheading) },
		questions: list(raw.questions, block),
		completion: completion(raw.completion),
		outcomes: list(raw.outcomes, outcome),
		defaultRoutine: normalizeRoutine(raw.defaultRoutine),
		updatedAt: text(raw.updatedAt)
	}
}

export const normalizeQuizSummary = (raw: unknown): QuizSummary | null => {
	if (!isObject(raw)) return null
	const slug = text(raw.slug)
	if (!slug) return null
	return {
		id: idOf(raw, slug),
		slug,
		title: text(raw.title) ?? '',
		kind: text(raw.kind) ?? 'onboarding',
		updatedAt: text(raw.updatedAt)
	}
}
