import { FiMessageCircle } from 'react-icons/fi'

import { useChatUI } from './ChatUIContext'
import { getAccentColor } from './accentColor'
import { getChatConfig } from '../../config/ChatConfig'

/**
 * ChatAvatar
 *
 * Avatar do assistente, usado no header do chat e como face do botão
 * flutuante da home. A imagem vem de `config.avatarUrl` — este pacote é
 * compartilhado entre marcas, então não embarca PNG de loja nenhuma. Sem
 * `avatarUrl`, desenha um balão branco sobre a cor de destaque, que já é
 * um avatar apresentável e evita o quadrado quebrado de imagem faltando.
 *
 * Props: { config?, className?, iconSize? }
 *  - config: config efetiva; obrigatória FORA do <WeniChat/> (o botão
 *    flutuante da home não tem ChatUIContext acima dele)
 *  - className: dimensões do círculo (ex.: 'w-9 h-9'); o resto do estilo é fixo
 *  - iconSize: tamanho do balão no fallback
 */
export default function ChatAvatar(props) {
	const { config: configProp, className = 'w-9 h-9', iconSize = 18 } = props
	// useChatUI devolve o default do contexto ({} vazio) fora do provider, então
	// não dá pra testar só por truthiness — daí o teste por conteúdo.
	const ui = useChatUI()
	const contextConfig = ui?.config && Object.keys(ui.config).length > 0 ? ui.config : null
	const config = configProp || contextConfig || getChatConfig()
	const avatarUrl = config?.avatarUrl

	if (avatarUrl) {
		return (
			<View className={`${className} rounded-full overflow-hidden`}>
				<Image
					src={avatarUrl}
					className='w-full h-full'
				/>
			</View>
		)
	}

	return (
		<View
			className={`${className} rounded-full flex items-center justify-center`}
			style={{ backgroundColor: getAccentColor(config) }}>
			<FiMessageCircle
				size={iconSize}
				className='text-white'
			/>
		</View>
	)
}
