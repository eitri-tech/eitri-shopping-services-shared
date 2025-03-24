import Eitri from "eitri-bifrost";

export default class ClarityService {
  static async init(projectId) {
    if (!projectId) {
      return;
    }
    try {
      await Eitri.clarity.init(projectId);
    } catch (e) {
      console.error("Error initializing Clarity", e);
    }
  }
}
