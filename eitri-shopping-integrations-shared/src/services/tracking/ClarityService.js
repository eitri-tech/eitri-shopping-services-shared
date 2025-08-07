import Eitri from "eitri-bifrost";

export default class ClarityService {
  static async init(projectId) {
    if (!projectId) {
      console.log("[SHARED] ClarityService: Project ID não fornecido")
      return;
    }
    try {
      console.log("[SHARED] ClarityService: Inicializando com project ID:", projectId)
      await Eitri.tracking.clarity.init(projectId);
      console.log("[SHARED] ClarityService: Inicializado com sucesso")
    } catch (e) {
      console.error("Error initializing Clarity", e);
    }
  }
}
