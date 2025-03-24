import Eitri from "eitri-bifrost";
// import Logger from './Logger'
import WakeService from "./WakeService";

export default class StorageService {
  static async setStorageItem(key, item) {
    const account = WakeService.configs.account;
    const _key = `${account}_${key}`;
    return Eitri.sharedStorage.setItem(_key, item);
  }

  static async getStorageItem(key) {
    const account = WakeService.configs.account;
    const _key = `${account}_${key}`;
    return Eitri.sharedStorage.getItem(_key);
  }

  static async setStorageJSON(key, item) {
    try {
      const account = WakeService.configs.account;
      const _key = `${account}_${key}`;
      return Eitri.sharedStorage.setItem(_key, JSON.stringify(item));
    } catch (e) {
      console.error("Erro ao salvar item no storage", e);
    }
  }

  static async getStorageJSON(key) {
    const account = WakeService.configs.account;
    const _key = `${account}_${key}`;
    const data = await Eitri.sharedStorage.getItem(_key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.log("Erro ao fazer parse do JSON");
        return null;
      }
    } else {
      return null;
    }
  }

  static async removeItem(key) {
    const account = WakeService.configs.account;
    const _key = `${account}_${key}`;
    return await Eitri.sharedStorage.removeItem(_key);
  }
}
