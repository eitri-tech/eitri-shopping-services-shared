import GAService from "./tracking/GAService";
import GAInternalService from "./tracking/GAInternalService";

export default class Tracking {
  static ga = GAService;
  static gaInternal = GAInternalService;
}
