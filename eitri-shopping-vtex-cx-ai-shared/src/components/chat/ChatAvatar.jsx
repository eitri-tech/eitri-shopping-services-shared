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
 * Props: { config?, className?, size?, iconSize? }
 *  - config: config efetiva; obrigatória FORA do <WeniChat/> (o botão
 *    flutuante da home não tem ChatUIContext acima dele)
 *  - className: dimensões do círculo via classe (ex.: 'w-full h-full', usado
 *    pelo ChatFab pra preencher um pai já dimensionado em px)
 *  - size: dimensão fixa em px (ex.: 36) — sobrepõe `className`. Preferir
 *    `size` sempre que o círculo precisa de um tamanho absoluto: classes tipo
 *    `w-9 h-9` dependem de rem e não saem de forma confiável quando este
 *    pacote é consumido como dependência de outro app (ver ChatFab.jsx).
 *  - iconSize: tamanho do balão no fallback
 */
export default function ChatAvatar(props) {
	const { config: configProp, className = 'w-9 h-9', size, iconSize = 18 } = props
	// useChatUI devolve o default do contexto ({} vazio) fora do provider, então
	// não dá pra testar só por truthiness — daí o teste por conteúdo.
	const ui = useChatUI()
	const contextConfig = ui?.config && Object.keys(ui.config).length > 0 ? ui.config : null
	const config = configProp || contextConfig || getChatConfig()
	const avatarUrl = config?.avatarUrl
	const sizeClassName = size ? '' : className
	const sizeStyle = size ? { width: size, height: size } : undefined

	if (avatarUrl) {
		return (
			<View
				className={`${sizeClassName} rounded-full overflow-hidden`}
				style={sizeStyle}>
				<Image
					src={avatarUrl}
					className='w-full h-full'
				/>
			</View>
		)
	}

	return (
		<View
			className={`${sizeClassName} rounded-full flex items-center justify-center`}
			style={{ ...sizeStyle, backgroundColor: getAccentColor(config) }}>
			<FiMessageCircle
				size={iconSize}
				className='text-white'
			/>
		</View>
	)
}
