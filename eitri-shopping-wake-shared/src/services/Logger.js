import WakeService from "./WakeService";

export default class Logger {
	static log = (...message) => {
		if (WakeService.configs.verbose) {
			console.log('[SHARED]', ...message)
		}
	}

	static warn = (...message) => {
		if (WakeService.configs.verbose) {
			console.warn('[SHARED]', ...message)
		}
	}

	static error = (...message) => {
		if (WakeService.configs.verbose) {
			console.error('[SHARED]', ...message)
		}
	}

	static info = (...message) => {
		if (WakeService.configs.verbose) {
			console.info('[SHARED]', ...message)
		}
	}
}
