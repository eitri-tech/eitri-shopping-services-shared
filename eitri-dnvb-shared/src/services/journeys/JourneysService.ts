import { CmsError } from '../../errors/CmsError'
import type { Quiz, QuizKind, QuizSummary, Routine } from '../../models/Journeys'
import CmsService from '../cms/CmsService'
import { normalizeQuiz, normalizeQuizSummary, normalizeRoutine } from './normalize'

const notNull = <T>(item: T | null): item is T => item !== null

/** Content-types `quiz` e `routine` do preset de jornada do DNVB, já normalizados. */
export default class JourneysService {
	static async listQuizzes(): Promise<QuizSummary[]> {
		return (await CmsService.listContents('quiz')).map(normalizeQuizSummary).filter(notNull)
	}

	static async listFullQuizzes(filter?: { kind?: QuizKind }): Promise<Quiz[]> {
		const docs = await CmsService.listContents('quiz', {
			full: true,
			filter: filter?.kind ? { kind: filter.kind } : undefined
		})
		return docs.map(normalizeQuiz).filter(notNull)
	}

	static async getQuiz(slug: string): Promise<Quiz> {
		const quiz = normalizeQuiz(await CmsService.getContent('quiz', slug))
		if (!quiz) throw new CmsError('INVALID_PAYLOAD', `Quiz "${slug}" com payload inválido`)
		return quiz
	}

	static async getQuizByKind(kind: QuizKind): Promise<Quiz> {
		const quiz = (await JourneysService.listFullQuizzes({ kind })).find(item => item.kind === kind)
		if (!quiz) throw new CmsError('NOT_FOUND', `Nenhum quiz do tipo "${kind}" publicado`)
		return quiz
	}

	static async getRoutine(slug: string): Promise<Routine> {
		const routine = normalizeRoutine(await CmsService.getContent('routine', slug))
		if (!routine) throw new CmsError('INVALID_PAYLOAD', `Rotina "${slug}" com payload inválido`)
		return routine
	}

	/** Busca pelo índice `products[*].productId`: id fora do `products` da rotina (sabor, kit) não acha nada. */
	static async getRoutinesByProduct(productId: string): Promise<Routine[]> {
		if (!productId) throw new CmsError('NOT_FOUND', 'productId vazio')
		const docs = await CmsService.listContents('routine', {
			full: true,
			filter: { 'products[*].productId': productId }
		})
		return docs.map(normalizeRoutine).filter(notNull)
	}
}
