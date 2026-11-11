import { useEffect, useState } from 'react'
import { Button, Page, Text, View } from 'eitri-luminus'
import Dnvb from '../services/Dnvb'
import Nexus from '../services/Nexus'

type Check = { label: string; status: 'loading' | 'ok' | 'error'; detail: string }

const errorText = (e: unknown): string => {
	const error = e as { code?: unknown; message?: unknown } | null
	const code = typeof error?.code === 'string' ? `${error.code}: ` : ''
	return `${code}${typeof error?.message === 'string' ? error.message : 'erro desconhecido'}`
}

/** View de desenvolvimento, como nos outros shared do repo: os apps consumidores usam só o `export.ts`. */
export default function Home(props) {
	const [checks, setChecks] = useState<Check[]>([])
	const [run, setRun] = useState(0)

	useEffect(() => {
		let active = true
		const update = (check: Check) => {
			if (active) setChecks(current => [...current.filter(item => item.label !== check.label), check])
		}
		const probe = async (label: string, task: () => Promise<string>) => {
			update({ label, status: 'loading', detail: '' })
			try {
				update({ label, status: 'ok', detail: await task() })
			} catch (e) {
				update({ label, status: 'error', detail: errorText(e) })
			}
		}

		setChecks([])
		void (async () => {
			await probe('Configuração', async () => {
				const config = await Dnvb.configure()
				return `${config.cmsUrl} · ${config.nexusUrl}`
			})
			await probe('CMS: quizzes', async () => `${(await Dnvb.journeys.listQuizzes()).length} publicados`)
			await probe('Nexus: sessão', async () => {
				const session = await Nexus.session.get()
				return session ? `instalação ${session.installationId || 'sem id'}` : 'sem sessão neste device'
			})
		})()

		return () => {
			active = false
		}
	}, [run])

	return (
		<Page className='w-screen min-h-screen bg-base-100'>
			<View className='flex flex-col gap-4 p-4 pt-12'>
				<Text className='text-xl font-bold'>eitri-dnvb-shared</Text>
				{checks.map(check => (
					<View
						key={check.label}
						className='flex flex-col gap-1 border-b border-base-300 pb-3'>
						<Text className='font-semibold'>
							{check.status === 'loading' ? '…' : check.status === 'ok' ? '✓' : '✕'} {check.label}
						</Text>
						{check.detail ? <Text className='text-sm opacity-70'>{check.detail}</Text> : null}
					</View>
				))}
				<Button
					className='btn btn-primary'
					onClick={() => setRun(value => value + 1)}>
					Rodar de novo
				</Button>
			</View>
		</Page>
	)
}
