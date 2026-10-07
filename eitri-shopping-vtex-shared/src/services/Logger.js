export default class Logger {
  static verbose = false

  static log = (...message) => {
    if (Logger.verbose) {
      console.log("[SHARED]", ...message);
    }
  };

  static warn = (...message) => {
    if (Logger.verbose) {
      console.warn("[SHARED]", ...message);
    }
  };

  static error = (...message) => {
    if (Logger.verbose) {
      console.error("[SHARED]", ...message);
    }
  };

  static info = (...message) => {
    if (Logger.verbose) {
      console.info("[SHARED]", ...message);
    }
  };
}
