import Eitri from "eitri-bifrost";
import App from "../App";
import Logger from "../Logger";

export default class GAService {
  static logScreenView = (currentPage, pageClass = "") => {
    try {
      Logger.log('Enviando logScreenView:', { screen: currentPage, screenClass: pageClass })
      
      if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.currentScreen) {
        Eitri.exposedApis.fb.currentScreen({
          screen: currentPage,
          screenClass: pageClass,
        });
        if (App.configs.gaVerbose) {
          console.log("[Analytics]", "[logScreenView]", {
            screen: currentPage,
            screenClass: pageClass,
          });
        }
        Logger.log('logScreenView enviado com sucesso')
      } else {
        console.log(
          "[Analytics] Eitri.exposedApis.fb.logScreenView not available",
        );
        Logger.warn('Firebase logScreenView não disponível')
      }
    } catch (error) {
      console.error("[Analytics] Error on logScreenView", error.message);
    }
  };

  static logEvent = (event, data) => {
    let params = {
      screen: document.title,
      ...data,
    };

    Logger.log('Enviando logEvent:', { eventName: event, data: params })

    // tentativa pelo fb
    try {
      Eitri.exposedApis.fb.logEvent({ eventName: event, data: params });
      if (App.configs.gaVerbose) {
        console.log("[Analytics]", "[logEvent]", {
          eventName: event,
          data: params,
        });
      }
      Logger.log('logEvent enviado com sucesso:', event)
      return;
    } catch (error) {
      console.error("[Analytics] Error on logEvent", error.message);
    }
  };

  static logError = (event, error) => {
    let params = {
      currentPage: document.title,
      event,
      ...error,
    };
    try {
      if (Eitri.exposedApis.fb && Eitri.exposedApis.fb.logError) {
        Eitri.exposedApis.fb.logError({ message: params });
        if (App.configs.gaVerbose) {
          console.log("[Analytics]", "[logError]", { message: params });
        }
      } else {
        console.error(
          "[Analytics] Eitri.exposedApis.fb.logError not available",
        );
      }
    } catch (error) {
      console.error("[Analytics] Error on logError", error.message);
    }
  };

  static sendCampaignDetails = segments => {
		if (!segments) return null

		Logger.log('Processando detalhes de campanha:', segments)

		const utmParams = {}
		for (const key of Object.keys(segments)) {
			const normalizedKey = key.replace(/[_-]/g, '').toLowerCase()

			if (normalizedKey.startsWith('utm')) {
				if (normalizedKey === 'utmcampaignid') {
					utmParams['campaign_id'] = segments[key]
				} else {
					utmParams[normalizedKey.substring(3)] = segments[key]
				}
			}
		}

    if (Object.keys(utmParams).length > 0) {
      console.log('[SHARED] Campaign segments details sent to GA')
      GAService.logEvent('campaign_details', utmParams)
		} else {
      Logger.warn('Nenhum parâmetro UTM válido encontrado')
    }
	}

  // TODO: Implementar métodos de ecommerce para GA (https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag)
}
