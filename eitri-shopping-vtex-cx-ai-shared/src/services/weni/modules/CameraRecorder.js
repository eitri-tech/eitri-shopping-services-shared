import EventEmitter from '../utils/EventEmitter';

import { SERVICE_EVENTS } from '../utils/constants';

export default class CameraRecorder extends EventEmitter {
  constructor() {
    super();

    this.cameraStream = null;
    this.devices = [];
    this.currentDeviceId = null;
  }

  /**
   * Starts camera recording
   * @returns {Promise<void>}
   */
  async start({ deviceId } = {}) {
    if (this.cameraStream) {
      this._stopCameraStream();
    }

    try {
      const constraints = {
        video: true,
      };

      if (deviceId) {
        constraints.video = { deviceId: { exact: deviceId } };
      }

      this.cameraStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      this.currentDeviceId = this.cameraStream
        .getTracks()
        .at(0)
        .getSettings().deviceId;

      this._enumerateDevices();

      this.emit(SERVICE_EVENTS.CAMERA_STREAM_RECEIVED, this.cameraStream);
      this.emit(SERVICE_EVENTS.CAMERA_RECORDING_STARTED);
    } catch (error) {
      this.cameraStream = null;
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    }
  }

  /**
   * Switches to the next device
   * @returns {Promise<void>}
   */
  async switchToNextDevice() {
    if (!this.devices || this.devices.length === 0) {
      throw new Error('No devices found');
    }

    const currentDeviceIndex = this.devices.findIndex(
      (device) => device.id === this.currentDeviceId,
    );

    if (currentDeviceIndex === -1) {
      this.start({ deviceId: this.devices.at(0).id });
      return;
    }

    const nextDevice =
      this.devices[(currentDeviceIndex + 1) % this.devices.length];

    this.start({ deviceId: nextDevice.id });
  }

  /**
   * Stops camera recording
   * @returns {Promise<Object>}
   */
  async stop() {
    this._stopCameraStream();
    this.emit(SERVICE_EVENTS.CAMERA_RECORDING_STOPPED);
  }

  /**
   * Checks if browser supports camera recording
   * @returns {boolean}
   */
  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Checks if camera permission is already granted
   * @returns {Promise<boolean|undefined>}
   */
  async hasPermission() {
    try {
      const result = await navigator.permissions.query({ name: 'camera' });
      if (result.state === 'prompt') return undefined;
      return result.state === 'granted';
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Requests camera permission and returns the permission state
   * @returns {Promise<boolean|undefined>}
   * @throws {Error} If permission is denied or not supported
   */
  async requestPermission() {
    if (!CameraRecorder.isSupported()) {
      throw new Error('Camera recording is not supported in this browser');
    }

    try {
      if (this.cameraStream) {
        this._stopCameraStream();
      }

      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      this._stopCameraStream();
    } catch (error) {
      this.cameraStream = null;

      if (error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use');
      } else {
        throw new Error(`Failed to access camera: ${error.message}`);
      }
    } finally {
      return await this.hasPermission();
    }
  }

  /**
   * Stops camera stream
   * @private
   */
  _stopCameraStream() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
    }
  }

  async _enumerateDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      this.devices = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          id: device.deviceId,
          label: device.label,
        }));

      this.emit(SERVICE_EVENTS.CAMERA_DEVICES_CHANGED, this.devices);
    } catch (error) {
      throw new Error('Failed to enumerate devices:', error);
    }
  }
}
