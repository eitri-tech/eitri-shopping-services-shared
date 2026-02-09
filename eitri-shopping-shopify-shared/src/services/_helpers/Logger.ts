import RemoteConfig from './../RemoteConfig'

export default class Logger {
	static log = (...message: any[]) => {
		const verbose = RemoteConfig.getContent('verbose')
		if (verbose) {
			console.log('[SHARED]', ...message)
		}
	}

	static warn = (...message: any[]) => {
		const verbose = RemoteConfig.getContent('verbose')
		if (verbose) {
			console.warn('[SHARED]', ...message)
		}
	}

	static error = (...message: any[]) => {
		const verbose = RemoteConfig.getContent('verbose')
		if (verbose) {
			console.error('[SHARED]', ...message)
		}
	}

	static info = (...message: any[]) => {
		const verbose = RemoteConfig.getContent('verbose')
		if (verbose) {
			console.info('[SHARED]', ...message)
		}
	}
}
