import Eitri from 'eitri-bifrost'
import { useState, useEffect } from 'react'
import { FiSend, FiPaperclip, FiCamera, FiImage, FiFile, FiMic, FiCheck } from 'react-icons/fi'

import { useChatUI } from './ChatUIContext'
import { accentBgStyle, accentTextStyle } from './accentColor'

// Waveform de "ouvindo": movimento real via JS (sem CSS keyframes custom). Um
// tick rápido avança uma onda senoidal; a altura de cada barra vem desta
// paleta LITERAL (para o JIT do Tailwind emitir as classes) e
// `transition-all duration-150` suaviza a mudança entre ticks.
const BAR_HEIGHTS = ['h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-7', 'h-8']
const WAVE_COUNT = 16

/**
 * ChatInput
 *
 * Composer inferior: menu de anexos (câmera / galeria / arquivo), campo de
 * texto e botão de ação à direita que se adapta:
 *  - texto digitado -> Enviar
 *  - vazio + módulo de voz disponível -> Mic (ditado via Eitri.speech; o texto
 *    reconhecido é enviado automaticamente)
 *
 * Visibilidade de câmera/voz respeita config.showCameraButton e
 * config.showVoiceRecordingButton.
 */
export default function ChatInput(props) {
	const {
		onSend,
		disabled,
		onCamera,
		onGallery,
		onFile,
		onDictate,
		onStopDictate,
		voiceAvailable,
		isDictating,
		speechLevel,
		onKeyboardShow,
		onKeyboardHide
	} = props

	const { config, texts } = useChatUI()

	const [text, setText] = useState('')
	const [showAttach, setShowAttach] = useState(false)
	const [keyboardOpen, setKeyboardOpen] = useState(false)
	const [elapsed, setElapsed] = useState(0)
	const [tick, setTick] = useState(0)

	// Cronômetro exibido durante o ditado (zera ao parar).
	useEffect(() => {
		if (!isDictating) {
			setElapsed(0)
			return
		}
		const timer = setInterval(() => setElapsed(prev => prev + 1), 1000)
		return () => clearInterval(timer)
	}, [isDictating])

	// Tick rápido que anima o waveform (avança a onda senoidal).
	useEffect(() => {
		if (!isDictating) {
			setTick(0)
			return
		}
		const t = setInterval(() => setTick(prev => prev + 1), 140)
		return () => clearInterval(t)
	}, [isDictating])

	const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

	// NÃO chamar scrollIntoView no campo aqui. O composer é o último filho de
	// uma coluna `flex h-full` sem ancestral rolável (a lista de mensagens é
	// irmã dele), então o pedido sobe até o documento e o WebView desloca a
	// viewport inteira — é isso que joga o painel do chat pra cima e come o
	// header. Quem reage ao teclado é o host, via onKeyboardShow/Hide: ele
	// encolhe o próprio layout e manda a lista pro fim.
	const handleFocus = () => {
		setKeyboardOpen(true)
		Eitri.bottomBar.hide()
		onKeyboardShow && onKeyboardShow()

		Eitri.keyboard.setVisibilityListener(status => {
			const isOpen = status.code === 'keyboardDidShow'
			setKeyboardOpen(isOpen)

			if (isOpen) {
				onKeyboardShow && onKeyboardShow()
			} else {
				Eitri.bottomBar.show()
				onKeyboardHide && onKeyboardHide()
			}
		})
	}

	const handleBlur = () => {
		setKeyboardOpen(false)
		Eitri.bottomBar.show()
		onKeyboardHide && onKeyboardHide()
	}

	const submit = () => {
		const value = text.trim()
		if (!value || disabled) return
		onSend && onSend(value)
		setText('')
	}

	const handleKeyDown = e => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			submit()
		}
	}

	const pick = action => {
		setShowAttach(false)
		if (typeof action === 'function') action()
	}

	// Voz no Eitri = ditado (speech-to-text); não há captura de áudio bruto.
	const hasText = text.trim().length > 0
	const showMic = !hasText && voiceAvailable && config.showVoiceRecordingButton !== false
	const showCamera = config.showCameraButton !== false
	const placeholder = config.inputTextFieldHint || texts.inputPlaceholder

	const attachOptions = [
		showCamera && { label: texts.camera, icon: FiCamera, action: onCamera },
		{ label: texts.gallery, icon: FiImage, action: onGallery },
		{ label: texts.file, icon: FiFile, action: onFile }
	].filter(Boolean)

	return (
		<View className='w-full border-t border-neutral-200 bg-white'>
			{isDictating ? (
				<View className='w-full flex flex-row items-center gap-3 px-3 py-3 bg-neutral-100'>
					{/* mic pulsante com anel de sonar */}
					<View className='relative flex items-center justify-center w-10 h-10'>
						<View
							className='absolute w-10 h-10 rounded-full opacity-30 animate-ping'
							style={accentBgStyle(config)}
						/>
						<View
							className='rounded-full p-2'
							style={accentBgStyle(config)}>
							<FiMic
								size={18}
								className='text-white'
							/>
						</View>
					</View>

					{/* waveform: onda senoidal cuja amplitude segue a atividade de fala
					    (speechLevel). Eitri.speech não dá volume real — o nível reflete
					    palavras chegando. */}
					<View className='flex-1 flex flex-col gap-1'>
						<View className='flex flex-row items-center gap-1 h-8'>
							{Array.from({ length: WAVE_COUNT }).map((_, i) => {
								const amp = 0.2 + 0.8 * (speechLevel || 0)
								const wave = (Math.sin(i * 0.6 + tick * 0.5) + 1) / 2
								const idx = Math.max(0, Math.round(wave * amp * (BAR_HEIGHTS.length - 1)))
								return (
									<View
										key={i}
										className={`w-1 rounded-full transition-all duration-150 ${BAR_HEIGHTS[idx]}`}
										style={accentBgStyle(config)}
									/>
								)
							})}
							<Text className='text-xs text-neutral-600 ml-2 font-mono'>{formatTime(elapsed)}</Text>
						</View>
						<Text className='text-xs text-neutral-400'>{texts.listening}</Text>
					</View>

					{/* concluir ditado */}
					<View
						onClick={() => onStopDictate && onStopDictate()}
						className='rounded-full p-3'
						style={accentBgStyle(config)}>
						<FiCheck
							size={20}
							className='text-white'
						/>
					</View>
				</View>
			) : (
				<>
					{showAttach && (
						<View className='w-full flex flex-row gap-6 px-4 py-3 border-b border-neutral-100'>
							{attachOptions.map((option, index) => {
								const OptionIcon = option.icon
								return (
									<View
										key={`attach-${index}`}
										onClick={() => pick(option.action)}
										className='flex flex-col items-center gap-1'>
										<View
											className='rounded-full p-3'
											style={accentBgStyle(config)}>
											<OptionIcon
												size={22}
												className='text-white'
											/>
										</View>
										<Text className='text-xs text-neutral-600'>{option.label}</Text>
									</View>
								)
							})}
						</View>
					)}

					<View className='w-full flex flex-row items-center gap-2 px-3 py-2'>
						<View
							onClick={() => setShowAttach(!showAttach)}
							className='p-2'>
							<FiPaperclip
								size={22}
								className={showAttach ? '' : 'text-neutral-400'}
								style={showAttach ? accentTextStyle(config) : undefined}
							/>
						</View>

						<View className='flex-1'>
							<TextInput
								className='w-full rounded-full border-neutral-200 border-solid border-2 bg-white px-4 py-2 text-neutral-900'
								placeholder={placeholder}
								value={text}
								onChange={e => setText(e.target.value)}
								onFocus={handleFocus}
								onBlur={handleBlur}
								onKeyDown={handleKeyDown}
							/>
						</View>

						{showMic ? (
							<View
								onClick={() => onDictate && onDictate()}
								className='rounded-full p-3'
								style={accentBgStyle(config)}>
								<FiMic
									size={20}
									className='text-white'
								/>
							</View>
						) : (
							<View
								onClick={submit}
								className={`rounded-full p-3 ${disabled || !hasText ? 'bg-neutral-200' : ''}`}
								style={disabled || !hasText ? undefined : accentBgStyle(config)}>
								<FiSend
									size={20}
									className='text-white'
								/>
							</View>
						)}
					</View>
				</>
			)}

			{/* Reserva o espaço da bottom bar / safe-area do host para o composer não
			    ficar atrás da navegação do app. */}
			{!keyboardOpen && (
				<View
					bottomInset={'auto'}
					className='w-full'
				/>
			)}
		</View>
	)
}
