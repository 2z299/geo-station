/**
 * データ永続化モジュール
 * IndexedDBとLocalStorageを使用してデータを保存
 */
import { openDB } from 'idb';

export class StorageManager {
  constructor() {
    this.dbName = 'geo-station-db';
    this.dbVersion = 1;
    this.db = null;
  }

  /**
   * データベースを初期化
   */
  async init() {
    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        // アラームストア
        if (!db.objectStoreNames.contains('alarms')) {
          const alarmStore = db.createObjectStore('alarms', { keyPath: 'id' });
          alarmStore.createIndex('status', 'status');
          alarmStore.createIndex('createdAt', 'createdAt');
        }

        // 駅情報キャッシュストア
        if (!db.objectStoreNames.contains('stations')) {
          const stationStore = db.createObjectStore('stations', { keyPath: 'id' });
          stationStore.createIndex('name', 'name');
        }
      }
    });
  }

  /**
   * アラームを保存
   * @param {Object} alarm - アラーム情報
   */
  async saveAlarm(alarm) {
    if (!this.db) await this.init();
    await this.db.put('alarms', alarm);
    console.log('Alarm saved:', alarm.id);
  }

  /**
   * すべてのアラームを読み込み
   * @returns {Promise<Array>} アラームの配列
   */
  async loadAlarms() {
    if (!this.db) await this.init();
    const alarms = await this.db.getAll('alarms');
    return alarms || [];
  }

  /**
   * アラームを削除
   * @param {string} alarmId - アラームID
   */
  async deleteAlarm(alarmId) {
    if (!this.db) await this.init();
    await this.db.delete('alarms', alarmId);
    console.log('Alarm deleted from storage:', alarmId);
  }

  /**
   * 駅情報をキャッシュ
   * @param {Object} station - 駅情報
   */
  async cacheStation(station) {
    if (!this.db) await this.init();
    await this.db.put('stations', station);
  }

  /**
   * キャッシュされた駅情報を取得
   * @param {string} stationId - 駅ID
   * @returns {Promise<Object|null>} 駅情報
   */
  async getCachedStation(stationId) {
    if (!this.db) await this.init();
    return await this.db.get('stations', stationId);
  }

  /**
   * 設定を保存（LocalStorage）
   * @param {Object} settings - 設定情報
   */
  saveSettings(settings) {
    try {
      localStorage.setItem('geo-station-settings', JSON.stringify(settings));
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * 設定を読み込み（LocalStorage）
   * @returns {Object} 設定情報
   */
  loadSettings() {
    try {
      const settingsStr = localStorage.getItem('geo-station-settings');
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    // デフォルト設定
    return {
      volume: 0.7,
      soundType: 'default',
      updateInterval: 5000,
      defaultRadius: 500,
      theme: 'light'
    };
  }

  /**
   * すべてのデータをクリア
   */
  async clearAll() {
    if (!this.db) await this.init();
    
    await this.db.clear('alarms');
    await this.db.clear('stations');
    localStorage.removeItem('geo-station-settings');
    
    console.log('All data cleared');
  }
}
