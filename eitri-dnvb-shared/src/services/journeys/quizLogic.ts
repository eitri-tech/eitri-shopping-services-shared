import type {
	ChoiceBlock,
	OutcomeCondition,
	Quiz,
	QuizAnswers,
	QuizAnswerValue,
	QuizBlock,
	QuizOutcome,
	Routine,
	ScaleBlock
} from '../../models/Journeys'

export const isChoiceBlock = (block: QuizBlock | null | undefined): block is ChoiceBlock => block?.blockType === 'choice'

/** `UnknownBlock` aceita qualquer string em `blockType`, então comparar o literal não estreita o tipo. */
export const isScaleBlock = (block: QuizBlock | null | undefined): block is ScaleBlock => block?.blockType === 'scale'

/** Aceita `string[]` e a forma legada `"a,b"`. */
export const choiceValues = (value: QuizAnswerValue | undefined): string[] => {
	if (Array.isArray(value)) return value.filter(item => typeof item === 'string' && item.length > 0)
	return typeof value === 'string' && value ? value.split(',').filter(Boolean) : []
}

/** Blocos do preset de jornada. Os demais não travam a conclusão: obrigatório e invisível, travaria para sempre. */
export const ANSWERABLE_BLOCKS = ['choice', 'scale', 'photo', 'time', 'consent', 'text']

export const isAnswered = (block: QuizBlock, value: QuizAnswerValue | undefined): boolean => {
	switch (block.blockType) {
		case 'choice':
			return choiceValues(value).length > 0
		case 'scale':
			return typeof value === 'number' ? Number.isFinite(value) : typeof value === 'string' && value !== ''
		case 'consent':
			return block.required ? value === true : typeof value === 'boolean'
		default:
			return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null
	}
}

export const isQuizComplete = (quiz: Quiz | null | undefined, answers: QuizAnswers | null | undefined): boolean =>
	!!quiz &&
	quiz.questions.every(
		block => !block.required || !ANSWERABLE_BLOCKS.includes(block.blockType) || isAnswered(block, answers?.[block.key])
	)

/** Rótulo legível da resposta; consent e photo voltam vazios, porque o texto é decisão do app. */
export const answerLabel = (block: QuizBlock | null | undefined, value: QuizAnswerValue | undefined): string => {
	if (!block || !isAnswered(block, value)) return ''
	if (isChoiceBlock(block)) {
		const picked = choiceValues(value)
		return block.options
			.filter(option => picked.includes(option.value))
			.map(option => option.label)
			.join(', ')
	}
	if (isScaleBlock(block)) {
		const point = block.points.find(item => item.value === Number(value))
		return point?.label ?? String(value)
	}
	if (block.blockType === 'photo' || block.blockType === 'consent') return ''
	return Array.isArray(value) ? value.join(', ') : String(value)
}

export const answerLabels = (quiz: Quiz | null | undefined, answers: QuizAnswers | null | undefined): Record<string, string> => {
	const labels: Record<string, string> = {}
	for (const block of quiz?.questions ?? []) labels[block.key] = answerLabel(block, answers?.[block.key])
	return labels
}

/** `{{goal}}` / `{{customer.firstName}}`: chave sem valor some do texto em vez de vazar as chaves. */
export const interpolate = (template: string | undefined, ctx: Record<string, unknown>): string =>
	(template ?? '')
		.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
			const value = path
				.split('.')
				.reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as any)[part] : undefined), ctx)
			return value === undefined || value === null ? '' : String(value)
		})
		.replace(/\s{2,}/g, ' ')
		.trim()

const conditionMatches = (block: QuizBlock | undefined, value: QuizAnswerValue | undefined, condition: OutcomeCondition) => {
	if (!block || value === undefined || value === null) return false
	const { operator, values } = condition
	if (block.blockType === 'choice') {
		const picked = choiceValues(value)
		return operator === 'in' ? values.some(item => picked.includes(item)) : operator === 'equals' && picked.includes(values[0])
	}
	if (block.blockType === 'consent') {
		const checked = value === true || value === 'true'
		return operator === 'equals' && checked === (values[0] === 'true')
	}
	if (block.blockType === 'scale') {
		const answer = Number(value)
		const targets = values.map(Number)
		if (!Number.isFinite(answer)) return false
		if (operator === 'in') return targets.includes(answer)
		if (!Number.isFinite(targets[0])) return false
		if (operator === 'gte') return answer >= targets[0]
		if (operator === 'lte') return answer <= targets[0]
		return answer === targets[0]
	}
	return false
}

/** Primeira regra cujas condições casam todas, na ordem do CMS. */
export const matchOutcome = (quiz: Quiz | null | undefined, answers: QuizAnswers | null | undefined): QuizOutcome | null => {
	if (!quiz) return null
	const byKey = new Map(quiz.questions.map(block => [block.key, block]))
	return (
		quiz.outcomes.find(outcome =>
			outcome.conditions.every(condition =>
				conditionMatches(byKey.get(condition.question), answers?.[condition.question], condition)
			)
		) ?? null
	)
}

/** Ordem do CMS: a regra que casar; senão, a rotina da primeira opção escolhida que tiver uma; senão, a padrão. */
export const resolveRoutine = (quiz: Quiz | null | undefined, answers: QuizAnswers | null | undefined): Routine | null => {
	if (!quiz) return null
	const fromOutcome = matchOutcome(quiz, answers)?.routine
	if (fromOutcome) return fromOutcome
	for (const block of quiz.questions) {
		if (!isChoiceBlock(block)) continue
		const picked = choiceValues(answers?.[block.key])
		const routine = block.options.find(option => picked.includes(option.value) && option.result.routine)?.result.routine
		if (routine) return routine
	}
	return quiz.defaultRoutine
}

export const findRoutineBySlug = (quiz: Quiz | null | undefined, slug: string | null | undefined): Routine | null => {
	if (!quiz || !slug) return null
	if (quiz.defaultRoutine?.slug === slug) return quiz.defaultRoutine
	const fromOutcome = quiz.outcomes.find(outcome => outcome.routine?.slug === slug)?.routine
	if (fromOutcome) return fromOutcome
	for (const block of quiz.questions) {
		if (!isChoiceBlock(block)) continue
		const match = block.options.find(option => option.result.routine?.slug === slug)
		if (match) return match.result.routine
	}
	return null
}
