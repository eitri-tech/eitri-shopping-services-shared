import { useEffect, useRef, useCallback, useMemo } from 'react'
import { Vtex } from 'eitri-shopping-vtex-shared'

import useWeniChat from '../../hooks/useWeniChat'
import { syncOrderFormField } from '../../services/ChatService'
import {
	openLink as routerOpenLink,
	openProductItem as routerOpenProductItem,
	parseProductRetailerId
} from '../../services/LinkRouter'
import { prefetchProducts } from '../../services/ProductCache'
import { ChatUIContext } from './ChatUIContext'
import ChatHeader from './ChatHeader'
import ChatStatusBanner from './ChatStatusBanner'
import ChatMessage from './ChatMessage'
import MessageText from './MessageText'
import LinkCard from './LinkCard'
import QuickReplies from './QuickReplies'
import ListMessage from './ListMessage'
import TypingIndicator from './TypingIndicator'
import ChatInput from './ChatInput'
import ProductCarousel from './ProductCarousel'
import ChatProductItem from './ChatProductItem'
import EmptyState from './EmptyState'

// Mapa de componentes padrão. QUALQUER um pode ser sobrescrito pelo host via
// prop `components` (ex.: components={{ ProductItem: MeuCard }}). Os defaults
// resolvem uns aos outros pelo ChatUIContext, então um override é respeitado
// também quando renderizado por outro default (ex.: ProductCarousel usa o
// ProductItem do contexto, não o import direto).
const DEFAULT_COMPONENTS = {
	Header: ChatHeader,
	StatusBanner: ChatStatusBanner,
	Message: ChatMessage,
	MessageText: MessageText,
	LinkCard: LinkCard,
	QuickReplies: QuickReplies,
	ListMessage: ListMessage,
	TypingIndicator: TypingIndicator,
	Input: ChatInput,
	ProductCarousel: ProductCarousel,
	ProductItem: ChatProductItem,
	EmptyState: EmptyState
}

const PREFETCH_CAROUSELS = 3
// Folga (px) para considerar que a lista "está no fim" — a última mensagem
// raramente termina exatamente na borda.
const NEAR_BOTTOM_TOLERANCE = 80
// Id da lista de mensagens. O Luminus não preenche `ref` com o nó DOM, então é
// por aqui que se chega no elemento que rola.
const LIST_ID = 'weni-chat-message-list'
// A animação do teclado leva ~300ms e o painel encolhe junto. Um pin só, no
// macrotask seguinte, roda com a altura antiga da lista e para curto — este
// segundo roda já com a altura final.
const KEYBOARD_SETTLE_DELAY = 350

function collectCarouselSkus(messages) {
	if (!Array.isArray(messages)) return []

	const lists = []
	for (let i = messages.length - 1; i >= 0 && lists.length < PREFETCH_CAROUSELS; i--) {
		if (messages[i]?.product_list) lists.unshift(messages[i].product_list)
	}

	return lists
		.flatMap(list => (Array.isArray(list?.sections) ? list.sections : []))
		.flatMap(section => (Array.isArray(section?.product_items) ? section.product_items : []))
		.map(item => parseProductRetailerId(item).skuId)
		.filter(Boolean)
}

/**
 * WeniChat
 *
 * A experiência completa de atendimento (chat Weni + IA) pronta para ser
 * embutida em uma view do app host:
 *
 *   <Page topInset>
 *     <WeniChat onAddToCart={...} />
 *   </Page>
 *
 * Configuração (precedência: defaults <- remoteConfig[seção] <- prop config):
 *  - config:   overrides do chat config (mesmo shape do weni_p / remoteConfig)
 *  - texts:    sobrescreve textos pontuais da UI
 *
 * Customização de UI:
 *  - components: substitui qualquer componente do mapa (Header, Message,
 *    MessageText, LinkCard, QuickReplies, ListMessage, TypingIndicator, Input,
 *    ProductCarousel, ProductItem, StatusBanner, EmptyState). Overrides podem
 *    usar useChatUI() para acessar config/texts/handlers.
 *  - slots: { top, aboveMessages, belowMessages, aboveInput } — render props
 *    para conteúdo extra sem substituir componentes.
 *  - showHeader / showBack / onBack
 *  - topInset (default true): reserva o espaço da status bar no header —
 *    desligue quando o chat já não começa no topo do device (ex.: sheet)
 *  - backIcon ('left' | 'down', default 'left'): ícone do botão de voltar —
 *    'down' fica melhor como "fechar" quando o chat é um painel/sheet
 *
 * Comportamento:
 *  - linkRules: regras extras de classificação de link (função ou
 *    {pattern, intent}), avaliadas antes das padrão
 *  - onNavigate(intent): interceptador de navegação; retorne true p/ consumir
 *  - onAddToCart(item): integração com o carrinho do host (default:
 *    Vtex.cart.addItem direto)
 *  - onKeyboardShow() / onKeyboardHide(): avisam o host que o teclado abriu ou
 *    fechou. O chat NÃO rola o documento para revelar o campo (isso deslocaria
 *    a tela inteira no iOS); quem estiver dentro de um painel/sheet deve usar
 *    esses avisos para encolher o próprio layout pela altura do teclado
 *  - resolveProduct(skuId): busca do produto no catálogo, injetada pelo host
 *    (o `Vtex` de dentro deste app compartilhado não é configurado pelo host).
 *    Com ela, os produtos do carrossel são pré-carregados assim que a mensagem
 *    chega e a PDP abre com o produto pronto, igual à vitrine. Sem ela, só o
 *    skuId viaja e a PDP resolve — funciona, mas demora mais a pintar.
 */
export default function WeniChat(props) {
	const {
		config: configOverrides,
		texts: textOverrides,
		components: componentOverrides,
		slots = {},
		linkRules,
		onNavigate,
		onAddToCart,
		resolveProduct,
		onBack,
		onKeyboardShow,
		onKeyboardHide,
		showHeader = true,
		showBack = true,
		topInset = true,
		backIcon = 'left',
		className = ''
	} = props

	const chat = useWeniChat({ config: configOverrides })
	const {
		config,
		messages,
		isConnected,
		connectionStatus,
		isTyping,
		isThinking,
		isReady,
		error,
		diag,
		voiceAvailable,
		isDictating,
		partialText,
		speechLevel,
		loadingMore,
		hasMore,
		sendMessage,
		sendReply,
		reconnect,
		newConversation,
		dictate,
		stopDictate,
		loadMore,
		sendCameraPhoto,
		sendGalleryImage,
		sendDocument
	} = chat

	// O Luminus não preenche `ref` com o nó DOM (só o evento sintético dá acesso a
	// ele, cf. ChatFab.handlePointerDown) — por isso a lista é achada por id. Com
	// `ref` o `scrollHeight` vinha undefined, os guards abaixo caíam e tanto o pin
	// quanto o auto-scroll de mensagem nova viravam no-op silencioso.
	const getList = () => (typeof document === 'undefined' ? null : document.getElementById(LIST_ID))

	// Rola a lista de mensagens até o fim mexendo só no scroll DELA — nunca
	// pedindo scroll ao documento (ver comentário em ChatInput.handleFocus).
	const pinToBottom = useCallback((smooth = false) => {
		const list = getList()
		if (!list) return
		if (smooth && list.scrollTo) {
			list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
			return
		}
		list.scrollTop = list.scrollHeight
	}, [])

	// Com o teclado aberto o host encolhe o painel; a lista fica mais baixa e
	// as últimas mensagens sairiam da área visível se o scroll não acompanhasse.
	// Só acompanha quem já estava no fim — quem subiu pra reler o histórico não
	// é puxado de volta só por tocar no campo. A medida tem que ser ANTES do
	// host encolher; o pin, depois (por isso o macrotask).
	const handleKeyboardShow = useCallback(() => {
		const list = getList()
		const distanceToBottom = list ? list.scrollHeight - list.scrollTop - list.clientHeight : 0
		onKeyboardShow && onKeyboardShow()
		if (distanceToBottom < NEAR_BOTTOM_TOLERANCE) {
			setTimeout(pinToBottom, 0)
			setTimeout(pinToBottom, KEYBOARD_SETTLE_DELAY)
		}
	}, [onKeyboardShow, pinToBottom])

	const components = useMemo(() => ({ ...DEFAULT_COMPONENTS, ...(componentOverrides || {}) }), [componentOverrides])
	const texts = useMemo(() => ({ ...(config.texts || {}), ...(textOverrides || {}) }), [config, textOverrides])

	const openLink = useCallback(
		url => routerOpenLink(url, { config, extraRules: linkRules, onNavigate }),
		[config, linkRules, onNavigate]
	)

	const openProduct = useCallback(
		item => routerOpenProductItem(item, { config, extraRules: linkRules, onNavigate, resolveProduct }),
		[config, linkRules, onNavigate, resolveProduct]
	)

	useEffect(() => {
		if (typeof resolveProduct !== 'function') return
		prefetchProducts(collectCarouselSkus(messages), resolveProduct)
	}, [messages, resolveProduct])

	const addToCart = useCallback(
		async item => {
			try {
				if (typeof onAddToCart === 'function') {
					return await onAddToCart(item)
				}
				const { skuId, sellerId } = parseProductRetailerId(item)
				return await Vtex.cart.addItem({
					id: skuId,
					seller: sellerId || '1',
					quantity: 1
				})
			} finally {
				// A primeira adição pode CRIAR o orderForm — re-publica o custom
				// field 'orderform' para o bot operar no mesmo carrinho do app.
				syncOrderFormField()
			}
		},
		[onAddToCart]
	)

	const ui = useMemo(
		() => ({ config, texts, components, chat, openLink, openProduct, addToCart }),
		[config, texts, components, chat, openLink, openProduct, addToCart]
	)

	const handleScroll = e => {
		if (e?.target?.scrollTop <= 24 && hasMore && !loadingMore) {
			loadMore()
		}
	}

	useEffect(() => {
		pinToBottom(true)
	}, [messages, isTyping, isThinking])

	const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null
	const showQuickReplies = lastMessage && lastMessage.direction === 'incoming' && lastMessage.quick_replies
	const showListMessage = lastMessage && lastMessage.direction === 'incoming' && lastMessage.list_message

	const Header = components.Header
	const StatusBanner = components.StatusBanner
	const Message = components.Message
	const QuickRepliesComponent = components.QuickReplies
	const ListMessageComponent = components.ListMessage
	const TypingIndicatorComponent = components.TypingIndicator
	const Input = components.Input
	const Empty = components.EmptyState

	return (
		<ChatUIContext.Provider value={ui}>
			<View className={`flex flex-col h-full bg-neutral-100 ${className}`}>
				{slots.top && slots.top(chat)}

				{showHeader && (
					<Header
						connectionStatus={connectionStatus}
						onNewConversation={newConversation}
						onBack={onBack}
						showBack={showBack}
						topInset={topInset}
						backIcon={backIcon}
					/>
				)}

				<StatusBanner
					connectionStatus={connectionStatus}
					isConnected={isConnected}
					onReconnect={reconnect}
				/>

				{config.debug && (
					<View className='w-full bg-gray-900 px-3 py-2 max-h-48 overflow-y-auto'>
						<Text className='text-[10px] text-green-300 font-mono'>
							status={connectionStatus} ready={String(isReady)} msgs={messages.length} err=
							{error ? error.message || String(error) : '-'}
						</Text>
						{diag.map((line, i) => (
							<Text
								key={i}
								className='text-[10px] text-gray-200 font-mono whitespace-pre-wrap'>
								{line}
							</Text>
						))}
					</View>
				)}

				{slots.aboveMessages && slots.aboveMessages(chat)}
				<View
					id={LIST_ID}
					className='flex-1 px-3 py-4'
					style={{ minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}
					onScroll={handleScroll}>
					{/* Skeleton enquanto a sessão hidrata/conecta — sem dependência externa. */}
					{!isReady && (
						<View className='w-full flex flex-col gap-3 mt-2'>
							<View className='w-3/5 h-10 rounded-2xl rounded-bl-md bg-neutral-200 animate-pulse' />
							<View className='w-2/5 h-10 rounded-2xl rounded-br-md bg-neutral-200 animate-pulse self-end' />
							<View className='w-1/2 h-10 rounded-2xl rounded-bl-md bg-neutral-200 animate-pulse' />
						</View>
					)}

					{loadingMore && (
						<View className='w-full flex justify-center py-2'>
							<Text className='text-xs text-neutral-400'>{texts.loadingMore}</Text>
						</View>
					)}

					{isReady && messages.length === 0 && <Empty />}

					{messages.map((message, index) => (
						<Message
							key={message.id || index}
							message={message}
						/>
					))}

					{showQuickReplies && (
						<QuickRepliesComponent
							replies={lastMessage.quick_replies}
							onSelect={sendReply}
						/>
					)}

					{showListMessage && (
						<ListMessageComponent
							listMessage={lastMessage.list_message}
							onSelect={sendReply}
						/>
					)}

					<TypingIndicatorComponent
						isTyping={isTyping}
						isThinking={isThinking}
					/>

					{slots.belowMessages && slots.belowMessages(chat)}

					<View />
				</View>

				{slots.aboveInput && slots.aboveInput(chat)}

				<Input
					onSend={sendMessage}
					disabled={!isReady}
					onCamera={sendCameraPhoto}
					onGallery={sendGalleryImage}
					onFile={sendDocument}
					onDictate={dictate}
					onStopDictate={stopDictate}
					voiceAvailable={voiceAvailable}
					isDictating={isDictating}
					partialText={partialText}
					speechLevel={speechLevel}
					onKeyboardShow={handleKeyboardShow}
					onKeyboardHide={onKeyboardHide}
				/>
			</View>
		</ChatUIContext.Provider>
	)
}
