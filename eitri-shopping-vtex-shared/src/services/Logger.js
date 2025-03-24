import Vtex from "./Vtex";
import App from "./App";

export default class Logger {
  static log = (...message) => {
    if (App.configs.verbose) {
      console.log("[SHARED]", ...message);
    }
  };

  static warn = (...message) => {
    if (App.configs.verbose) {
      console.warn("[SHARED]", ...message);
    }
  };

  static error = (...message) => {
    if (App.configs.verbose) {
      console.error("[SHARED]", ...message);
    }
  };

  static info = (...message) => {
    if (App.configs.verbose) {
      console.info("[SHARED]", ...message);
    }
  };
}
