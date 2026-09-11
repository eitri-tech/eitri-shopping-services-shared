import { View, Text } from 'eitri-luminus'
import Eitri from 'eitri-bifrost'
import { ReactNode, useEffect, useState } from 'react'

import SizebayService from '../services/SizebayService'
import { GetSizeBayUrlsInput, SizeBayUrls } from '../models/Sizebay'

export interface SizeBayProps extends GetSizeBayUrlsInput {
	discoverLabel?: string
	sizeGuideLabel?: string
	/** Ícone do botão "descubra seu tamanho". Sem default — este pacote não força nenhuma lib de ícones. */
	discoverIcon?: ReactNode
	/** Ícone do botão "tabela de medidas". Sem default — este pacote não força nenhuma lib de ícones. */
	sizeGuideIcon?: ReactNode
	className?: string
}

/**
 * Dois botões — "descubra seu tamanho" (provador virtual) e "tabela de medidas" — que abrem a UI
 * hospedada da Sizebay via `Eitri.openBrowser` (Custom Tab nativa), nunca em `Webview`: a UI da
 * Sizebay depende de `window.open()`/`target="_blank"` (comparação de marca, redes sociais), que
 * não funciona de dentro de um `Webview`/iframe aninhado. Exige `SizebayService.configure(...)`
 * já ter sido chamado com o `tenantId` da loja.
 *
 * Não renderiza nada enquanto as URLs não resolvem, nem quando a Sizebay não retorna produto
 * válido para o `permalink` informado.
 */
export default function SizeBay(props: SizeBayProps) {
	const {
		discoverLabel = 'Descubra seu tamanho',
		sizeGuideLabel = 'Tabela de Medidas',
		discoverIcon,
		sizeGuideIcon,
		className,
		...input
	} = props

	const [urls, setUrls] = useState<SizeBayUrls | null>(null)

	useEffect(() => {
		let cancelled = false

		if (!input.permalink) {
			setUrls(null)
			return
		}

		SizebayService.getSizeBayUrls(input)
			.then(result => {
				if (!cancelled) setUrls(result)
			})
			.catch(e => console.error('[SizeBay] Erro ao buscar URLs da Sizebay', e))

		return () => {
			cancelled = true
		}
	}, [input.permalink, input.lang, input.productImage, input.sizesInStock])

	const openUrl = async (url: string) => {
		try {
			await Eitri.openBrowser({ url, inApp: true })
		} catch (e) {
			console.error('[SizeBay] Erro ao abrir URL da Sizebay', e)
		}
	}

	if (!urls) return null

	return (
		<View className={`flex flex-row gap-4 ${className ?? ''}`}>
			{urls.vfrUrl && (
				<View
					onClick={() => openUrl(urls.vfrUrl as string)}
					className='flex items-center gap-2 rounded border border-gray-500 p-2 w-fit'>
					{discoverIcon}
					<Text className='whitespace-nowrap text-xs'>{discoverLabel}</Text>
				</View>
			)}
			<View
				onClick={() => openUrl(urls.chartUrl)}
				className='flex items-center gap-2 rounded border border-gray-500 p-2 w-fit'>
				{sizeGuideIcon}
				<Text className='whitespace-nowrap text-xs'>{sizeGuideLabel}</Text>
			</View>
		</View>
	)
}
