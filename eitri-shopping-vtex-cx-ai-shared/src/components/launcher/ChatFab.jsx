import { useRef, useState } from 'react'

import ChatAvatar from '../chat/ChatAvatar'

const DRAG_THRESHOLD = 6
const SNAP_DURATION = 200

/**
 * ChatFab
 *
 * Botão flutuante (assistente de compras) que abre o painel do chat por cima
 * da tela do host. Arrastável, sempre restrito a uma área que não invade a
 * bottom tab bar nem o header, e gruda na borda esquerda/direita mais perto ao
 * soltar.
 *
 * Props: { onTap, config }
 *  - config: config efetiva do chat; a geometria sai de `config.launcher` e o
 *    rosto do botão é o avatar da marca (config.avatarUrl)
 */
export default function ChatFab(props) {
	const { onTap, config } = props
	const [position, setPosition] = useState(null)
	const [isSnapping, setIsSnapping] = useState(false)
	const onTapRef = useRef(onTap)
	onTapRef.current = onTap

	const launcher = config?.launcher || {}
	const fabSize = launcher.fabSize ?? 56
	const topGap = launcher.fabTopGap ?? 60
	const bottomGap = launcher.fabBottomGap ?? 100
	const edgeMargin = launcher.fabEdgeMargin ?? 16

	const geometryRef = useRef({ fabSize, topGap, bottomGap, edgeMargin })
	geometryRef.current = { fabSize, topGap, bottomGap, edgeMargin }

	const clampPosition = (left, top) => {
		const { fabSize, topGap, bottomGap } = geometryRef.current
		const maxLeft = window.innerWidth - fabSize
		const maxTop = window.innerHeight - bottomGap - fabSize
		return {
			left: Math.max(0, Math.min(left, maxLeft)),
			top: Math.max(topGap, Math.min(top, maxTop))
		}
	}

	// Ao soltar, gruda na borda mais perto (esquerda ou direita) em vez de
	// deixar o botão solto no meio da tela.
	const snapToEdge = (left, top) => {
		const { fabSize, edgeMargin } = geometryRef.current
		const centerX = left + fabSize / 2
		const isLeftHalf = centerX < window.innerWidth / 2
		return {
			left: isLeftHalf ? edgeMargin : window.innerWidth - fabSize - edgeMargin,
			top
		}
	}

	const dragRef = useRef({
		dragging: false,
		moved: false,
		offsetX: 0,
		offsetY: 0,
		startX: 0,
		startY: 0,
		left: 0,
		top: 0
	})

	const handlePointerMove = event => {
		const drag = dragRef.current
		if (!drag.dragging) return
		event.preventDefault()

		if (!drag.moved) {
			const dx = event.clientX - drag.startX
			const dy = event.clientY - drag.startY
			if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
			drag.moved = true
		}

		const next = clampPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY)
		drag.left = next.left
		drag.top = next.top
		setPosition(next)
	}

	const stopDragging = () => {
		const drag = dragRef.current
		if (!drag.dragging) return
		drag.dragging = false
		window.removeEventListener('pointermove', handlePointerMove)
		window.removeEventListener('pointerup', stopDragging)
		window.removeEventListener('pointercancel', stopDragging)

		if (!drag.moved) {
			onTapRef.current?.()
			return
		}

		setIsSnapping(true)
		setPosition(snapToEdge(drag.left, drag.top))
		setTimeout(() => setIsSnapping(false), SNAP_DURATION)
	}

	// currentTarget é o nó DOM real por trás do <View> (o Luminus não expõe
	// isso via `ref`, mas o evento sintético do React sim).
	const handlePointerDown = event => {
		if (event.pointerType === 'mouse' && event.button !== 0) return
		const rect = event.currentTarget.getBoundingClientRect()
		dragRef.current = {
			dragging: true,
			moved: false,
			offsetX: event.clientX - rect.left,
			offsetY: event.clientY - rect.top,
			startX: event.clientX,
			startY: event.clientY,
			left: rect.left,
			top: rect.top
		}
		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerup', stopDragging)
		window.addEventListener('pointercancel', stopDragging)
	}

	return (
		<View
			onPointerDown={handlePointerDown}
			className={`fixed z-[9999] touch-none select-none rounded-full shadow-lg overflow-hidden ${
				isSnapping ? 'transition-all duration-200 ease-out' : ''
			} ${position ? '' : 'bottom-[110px] right-4'}`}
			style={
				position
					? { left: position.left, top: position.top, width: fabSize, height: fabSize }
					: { width: fabSize, height: fabSize }
			}>
			<ChatAvatar
				config={config}
				className='w-full h-full'
				iconSize={Math.round(fabSize / 2)}
			/>
		</View>
	)
}
