import { useEffect, useState } from 'react'

import WeniChat from '../chat/WeniChat'

const ANIMATION_DURATION = 300
// Espera um tick antes de ligar a classe de entrada — precisa que o
// navegador pinte a posição inicial (fora da tela) antes de animar pra
// posição final, senão a transição não roda. requestAnimationFrame duplo
// nem sempre é respeitado em todo WebView, um timeout curto é mais confiável.
const ENTER_DELAY = 20
// Última altura de teclado medida nesta sessão. Vive fora do componente de
// propósito: serve para encolher o painel já no `focus`, antes do primeiro
// `visualViewport.resize`. Se o painel só encolhesse depois que o teclado
// terminou de abrir, o WebKit do iOS já teria rolado a página para revelar o
// campo — e é essa rolagem que sobe a tela inteira. Começa numa estimativa
// (não 0): a primeira vez da sessão não tinha medida nenhuma pra aplicar no
// focus, e o campo ficava atrás do teclado até o resize chegar.
let lastKeyboardHeight = 300

/**
 * ChatSheet
 *
 * Painel do assistente sobreposto à tela do host — não troca de app, deixa uma
 * tira do topo visível e fecha ao tocar em voltar (reaproveita o botão de
 * voltar do próprio header do chat). Desliza de baixo pra cima ao abrir e de
 * volta pra baixo ao fechar.
 *
 * Props: { open, onClose, sheetTop?, ...weniChatProps }
 *  - sheetTop: faixa (px) da tela do host que fica visível acima do painel;
 *    varia com a altura do header de cada marca (vem de config.launcher.sheetTop
 *    quando montado pelo ChatLauncher)
 *  - qualquer outra prop (config, onAddToCart, resolveProduct, components,
 *    texts...) é repassada ao <WeniChat/>
 */
export default function ChatSheet(props) {
	const { open, onClose, sheetTop = 140, ...chatProps } = props

	// Continua montado durante a animação de saída — sem isso o painel some
	// de uma vez (o `open=false` já teria desmontado antes da transição rodar).
	const [shouldRender, setShouldRender] = useState(open)
	const [visible, setVisible] = useState(false)
	// `position: fixed; bottom: 0` não acompanha o teclado on-screen (a Bifrost
	// não expõe a altura dele, só o evento de show/hide) — mede a diferença
	// pelo visualViewport (padrão web, já usado em ChatFab.jsx) e sobe a borda
	// de baixo do painel disso. Não é só pra não esconder o input: encolhendo o
	// painel, o campo já fica visível e o WebKit do iOS não tem o que revelar,
	// então ele para de rolar a página e o topo do chat fica no lugar.
	// Este é o ÚNICO lugar que compensa o teclado — compensar aqui e no padding
	// da coluna de dentro soma, e abre um vão do tamanho do teclado.
	const [keyboardInset, setKeyboardInset] = useState(0)
	// Quanto o WebKit deslocou a área visível dentro da página (`fixed` se ancora
	// no layout viewport, que não se mexe — por isso o painel "sobe" sozinho).
	// Somado no `top` e descontado no `bottom`, o painel volta a acompanhar o que
	// está visível. No Android é sempre 0.
	const [viewportOffset, setViewportOffset] = useState(0)

	useEffect(() => {
		if (open) {
			setShouldRender(true)
			const timeout = setTimeout(() => setVisible(true), ENTER_DELAY)
			return () => clearTimeout(timeout)
		} else {
			setVisible(false)
			const timeout = setTimeout(() => setShouldRender(false), ANIMATION_DURATION)
			return () => clearTimeout(timeout)
		}
	}, [open])

	useEffect(() => {
		const vv = typeof window !== 'undefined' ? window.visualViewport : null
		if (!open || !vv) return

		const onViewportChange = () => {
			// Altura do teclado. NÃO descontar `vv.offsetTop` AQUI: isto é uma
			// MEDIDA, não uma posição. No iOS o offsetTop passa a valer ~a altura do
			// teclado assim que o WebKit desloca a página, e a conta zeraria
			// justamente na plataforma que precisa da compensação.
			const inset = Math.max(0, window.innerHeight - vv.height)
			if (inset > 0) lastKeyboardHeight = inset
			setKeyboardInset(inset)
			// Quanto o WebKit já deslocou a área visível dentro da página. É com
			// isto que o painel se reposiciona (ver o `style` lá embaixo).
			setViewportOffset(vv.offsetTop)
		}
		onViewportChange()
		vv.addEventListener('resize', onViewportChange)
		// `scroll` do visualViewport: o offsetTop muda sem que a altura mude, que é
		// exatamente o caso de arrastar a página de volta depois do deslocamento.
		vv.addEventListener('scroll', onViewportChange)
		return () => {
			vv.removeEventListener('resize', onViewportChange)
			vv.removeEventListener('scroll', onViewportChange)
			setKeyboardInset(0)
			setViewportOffset(0)
		}
	}, [open])

	// Chega no `focus`, antes de o teclado abrir: aplica a última altura
	// conhecida pra não esperar o primeiro resize. Só a primeira digitação da
	// sessão fica sem essa dica (aí o resize resolve, com um quadro mais tosco).
	const primeKeyboardInset = () => setKeyboardInset(current => current || lastKeyboardHeight)

	if (!shouldRender) return null

	return (
		<View
			style={{
				zIndex: 9999,
				top: sheetTop + viewportOffset,
				bottom: keyboardInset - viewportOffset,
				transform: visible ? 'translateY(0)' : 'translateY(100%)',
				transition: `transform ${ANIMATION_DURATION}ms ease-out`
			}}
			className='fixed left-0 right-0 flex flex-col bg-white rounded-t-2xl shadow-2xl overflow-hidden'>
			<View className='w-full pt-2 pb-1' />
			<View className='flex-1 min-h-0'>
				<WeniChat
					{...chatProps}
					onBack={onClose}
					topInset={false}
					backIcon='down'
					onKeyboardShow={primeKeyboardInset}
					onKeyboardHide={() => setKeyboardInset(0)}
				/>
			</View>
		</View>
	)
}
