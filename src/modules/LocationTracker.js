/**
 * 位置情報取得モジュール
 * Geolocation APIを使用してユーザーの現在位置を継続的に取得
 */
export class LocationTracker {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.callbacks = [];
    this.isTracking = false;
  }

  /**
   * 位置追跡を開始
   * @param {Object} options - Geolocation APIのオプション
   */
  startTracking(options = {}) {
    if (this.isTracking) {
      console.log('Already tracking location');
      return;
    }

    if (!navigator.geolocation) {
      throw new Error('Geolocation API is not supported');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const trackingOptions = { ...defaultOptions, ...options };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        this.notifyCallbacks(this.currentPosition);
      },
      (error) => {
        console.error('Location error:', error);
        this.handleError(error);
      },
      trackingOptions
    );

    this.isTracking = true;
    console.log('Location tracking started');
  }

  /**
   * 位置追跡を停止
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      console.log('Location tracking stopped');
    }
  }

  /**
   * 現在位置を返す
   * @returns {Object|null} 現在の位置情報
   */
  getCurrentPosition() {
    return this.currentPosition;
  }

  /**
   * 位置更新時のコールバックを登録
   * @param {Function} callback - 位置が更新された時に呼ばれる関数
   */
  addCallback(callback) {
    this.callbacks.push(callback);
  }

  /**
   * コールバックを削除
   * @param {Function} callback - 削除するコールバック関数
   */
  removeCallback(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * 登録されたすべてのコールバックに通知
   * @param {Object} position - 位置情報
   */
  notifyCallbacks(position) {
    this.callbacks.forEach(callback => {
      try {
        callback(position);
      } catch (error) {
        console.error('Callback error:', error);
      }
    });
  }

  /**
   * エラーハンドリング
   * @param {Object} error - Geolocation APIのエラー
   */
  handleError(error) {
    let message = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = '位置情報の許可が拒否されました';
        break;
      case error.POSITION_UNAVAILABLE:
        message = '位置情報を取得できません';
        break;
      case error.TIMEOUT:
        message = '位置情報の取得がタイムアウトしました';
        break;
      default:
        message = '不明なエラーが発生しました';
    }
    console.error(message, error);
  }

  /**
   * 一度だけ現在位置を取得
   * @returns {Promise<Object>} 位置情報
   */
  async getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation API is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
}
