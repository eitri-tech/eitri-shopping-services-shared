import type { CmsImage, CmsSection, Open } from './Cms'

export type QuizKind = Open<'onboarding' | 'checkin' | 'survey'>
export type QuizPresentation = Open<'single-page' | 'stepper' | 'instant'>
export type QuizBlockType = Open<'choice' | 'scale' | 'photo' | 'time' | 'consent' | 'text'>
export type ChoiceLayout = Open<'media' | 'list' | 'chips' | 'swatches' | 'grid'>
export type ScaleLayout = Open<'buttons' | 'slider'>
export type TimeLayout = Open<'picker' | 'slots'>
export type PhotoCompare = Open<'first' | 'previous' | 'none'>
export type CompletionDisplay = Open<'inline-card' | 'message' | 'screen'>
export type QuizCtaAction = Open<'start-routine' | 'open-product' | 'open-url' | 'next-screen'>
export type QuizCtaStyle = Open<'primary' | 'secondary'>
export type RoutinePeriod = Open<'any' | 'morning' | 'night'>
export type RoutineProductRole = Open<'main' | 'complement'>
export type ReminderChannel = Open<'push' | 'whatsapp' | 'email'>
export type OutcomeOperator = 'equals' | 'in' | 'gte' | 'lte'

export interface RoutineProduct {
	id: string
	productId: string
	role: RoutineProductRole
	dose?: string
}

export interface RoutineStep {
	id: string
	title: string
	description?: string
	period: RoutinePeriod
	productId?: string
}

export interface RoutineMilestone {
	id: string
	day: number
	title: string
	description?: string
}

/** `time` fixo ou `fromAnswer` (key de uma pergunta `time` do quiz): o CMS exige um dos dois. */
export interface RoutineReminder {
	id: string
	time?: string
	fromAnswer?: string
	offsetMinutes: number
	repeatEveryMinutes?: number
	repeatTimes?: number
	/** 0 = domingo (`Date#getDay`); vazio = todos os dias. */
	days: number[]
	channel: ReminderChannel
}

export interface RoutineCheckin {
	/** Slug do quiz de check-in. */
	quiz: string
	everyDays: number
}

export interface Routine {
	id: string
	slug: string
	name: string
	/** `null` = rotina contínua, sem data de fim. */
	durationDays: number | null
	summary?: string
	products: RoutineProduct[]
	steps: RoutineStep[]
	milestones: RoutineMilestone[]
	highlights: string[]
	reminders: RoutineReminder[]
	checkin: RoutineCheckin | null
	/** Seções habilitadas como vieram do CMS, com campos que o tenant acrescentou aos blocos. */
	sections: CmsSection[]
	updatedAt?: string
}

export interface QuizOptionResult {
	routine: Routine | null
	products: string[]
}

export interface QuizOption {
	id: string
	value: string
	label: string
	description?: string
	accentColor?: string
	image?: CmsImage
	result: QuizOptionResult
}

interface QuizBlockBase {
	id: string
	key: string
	label: string
	helpText?: string
	required: boolean
}

export interface ChoiceBlock extends QuizBlockBase {
	blockType: 'choice'
	/** Vazio: o app escolhe o visual pelo conteúdo das opções. */
	layout?: ChoiceLayout
	columns?: number
	multiple: boolean
	maxSelections?: number
	options: QuizOption[]
}

export interface ScalePoint {
	value: number
	label: string
}

export interface ScaleBlock extends QuizBlockBase {
	blockType: 'scale'
	layout: ScaleLayout
	min: number
	max: number
	step: number
	minLabel?: string
	maxLabel?: string
	points: ScalePoint[]
}

export interface PhotoBlock extends QuizBlockBase {
	blockType: 'photo'
	guidance?: string
	compareWith: PhotoCompare
}

export interface TimeSlot {
	id: string
	/** HH:MM */
	value: string
	label?: string
	hint?: string
}

export interface TimeBlock extends QuizBlockBase {
	blockType: 'time'
	layout: TimeLayout
	slots: TimeSlot[]
}

export interface ConsentBlock extends QuizBlockBase {
	blockType: 'consent'
	/** Permissão do aparelho pedida ao marcar (ex.: `push`, `camera`). */
	permission?: string
	defaultValue: boolean
}

export interface TextBlock extends QuizBlockBase {
	blockType: 'text'
	multiline: boolean
	placeholder?: string
	maxLength?: number
}

export interface UnknownBlock extends QuizBlockBase {
	blockType: Exclude<QuizBlockType, 'choice' | 'scale' | 'photo' | 'time' | 'consent' | 'text'>
	[field: string]: unknown
}

export type QuizBlock = ChoiceBlock | ScaleBlock | PhotoBlock | TimeBlock | ConsentBlock | TextBlock | UnknownBlock

export interface QuizHeader {
	eyebrow?: string
	heading?: string
	subheading?: string
}

export interface QuizCta {
	id: string
	label: string
	action: QuizCtaAction
	target?: string
	style: QuizCtaStyle
}

export interface QuizCompletion {
	display: CompletionDisplay
	eyebrow?: string
	heading?: string
	body?: string
	ctas: QuizCta[]
}

export interface OutcomeCondition {
	/** Key da pergunta. */
	question: string
	operator: OutcomeOperator
	values: string[]
}

export interface OutcomeProduct {
	productId: string
	reason?: string
}

export interface QuizOutcome {
	id: string
	label: string
	conditions: OutcomeCondition[]
	routine: Routine | null
	extraProducts: OutcomeProduct[]
	copyOverrides: Pick<QuizCompletion, 'eyebrow' | 'heading' | 'body'>
}

export interface Quiz {
	id: string
	slug: string
	title: string
	kind: QuizKind
	presentation: QuizPresentation
	header: QuizHeader
	questions: QuizBlock[]
	completion: QuizCompletion | null
	outcomes: QuizOutcome[]
	defaultRoutine: Routine | null
	updatedAt?: string
}

export interface QuizSummary {
	id: string
	slug: string
	title: string
	kind: QuizKind
	updatedAt?: string
}

/**
 * choice: `option.value` (`string[]` na múltipla); scale: número; time: HH:MM; consent: boolean;
 * text: texto; photo: o que o app guardar (URI, id).
 */
export type QuizAnswerValue = string | number | boolean | string[]
export type QuizAnswers = Record<string, QuizAnswerValue>
