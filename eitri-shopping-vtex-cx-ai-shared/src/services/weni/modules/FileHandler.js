import EventEmitter from '../utils/EventEmitter';

import {
  DEFAULTS,
  ALLOWED_FILE_TYPES,
  SERVICE_EVENTS,
} from '../utils/constants';

/**
 * FileHandler
 *
 * Handles file operations:
 * - Validates file types and sizes
 * - Converts files to base64
 * - Optional image compression
 * - Supports multiple file uploads
 */
export default class FileHandler extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxFileSize: config.maxFileSize || DEFAULTS.MAX_FILE_SIZE,
      allowedTypes: config.allowedTypes || ALLOWED_FILE_TYPES,
      compressImages:
        config.compressImages !== false || DEFAULTS.COMPRESS_IMAGES,
      imageQuality: config.imageQuality || DEFAULTS.IMAGE_QUALITY,
      maxImageWidth: config.maxImageWidth || DEFAULTS.MAX_IMAGE_WIDTH,
      maxImageHeight: config.maxImageHeight || DEFAULTS.MAX_IMAGE_HEIGHT,
      ...config,
    };
  }

  /**
   * Processes a file for upload
   * @param {File} file
   * @returns {Promise<Object>}
   */
  async process(file) {
    try {
      this._validateFile(file);

      const type = this._getFileType(file);

      let base64 = await this._toBase64(file);

      if (type === 'image' && this.config.compressImages) {
        base64 = await this._compressImage(base64, file.type);
      }

      const result = {
        type,
        base64,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      };

      this.emit(SERVICE_EVENTS.FILE_PROCESSED, result);
      return result;
    } catch (error) {
      this.emit(SERVICE_EVENTS.ERROR, error);
      throw error;
    }
  }

  /**
   * Processes multiple files
   * @param {FileList|Array<File>} files
   * @returns {Promise<Array>}
   */
  async processMultiple(files) {
    const fileArray = Array.from(files);
    const promises = fileArray.map((file) => this.process(file));
    return Promise.all(promises);
  }

  /**
   * Validates file
   * @private
   * @param {File} file
   * @throws {Error}
   */
  _validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type) {
      throw new Error('File type is required');
    }

    if (!this.config.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    if (file.size > this.config.maxFileSize) {
      const sizeMB = (this.config.maxFileSize / (1024 * 1024)).toFixed(0);
      throw new Error(`File size exceeds ${sizeMB}MB limit`);
    }
  }

  /**
   * Gets file type category
   * @private
   * @param {File} file
   * @returns {string}
   */
  _getFileType(file) {
    if (file.type.startsWith('image/')) {
      return 'image';
    }

    if (file.type.startsWith('video/')) {
      return 'video';
    }

    if (file.type.startsWith('audio/')) {
      return 'audio';
    }

    return 'file';
  }

  /**
   * Converts file to base64
   * @private
   * @param {File} file
   * @returns {Promise<string>}
   */
  _toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Compresses image
   * @private
   * @param {string} base64
   * @param {string} mimeType
   * @returns {Promise<string>}
   */
  _compressImage(base64, mimeType) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate new dimensions
          let { width, height } = img;

          if (
            width > this.config.maxImageWidth ||
            height > this.config.maxImageHeight
          ) {
            const ratio = Math.min(
              this.config.maxImageWidth / width,
              this.config.maxImageHeight / height,
            );

            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL(
            mimeType,
            this.config.imageQuality,
          );
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = base64;
    });
  }
}
