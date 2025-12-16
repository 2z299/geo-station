/**
 * geo-station メインアプリケーション
 */
import { LocationTracker } from './modules/LocationTracker.js';
import { DistanceCalculator } from './modules/DistanceCalculator.js';
import { AlarmManager } from './modules/AlarmManager.js';
import { StationSearcher } from './modules/StationSearcher.js';
import { StorageManager } from './modules/StorageManager.js';
import './style.css';

class GeoStationApp {
  constructor() {
    this.locationTracker = new LocationTracker();
    this.distanceCalculator = new DistanceCalculator();
    this.alarmManager = new AlarmManager(this.distanceCalculator);
    this.stationSearcher = new StationSearcher();
    this.storageManager = new StorageManager();
    
    this.currentView = 'home';
    this.selectedStation = null;
    this.settings = null;
  }

  /**
   * アプリケーションを初期化
   */
  async init() {
    console.log('Initializing geo-station app...');
    
    // ストレージを初期化
    await this.storageManager.init();
    this.settings = this.storageManager.loadSettings();
    
    // 保存されたアラームを読み込み
    const savedAlarms = await this.storageManager.loadAlarms();
    savedAlarms.forEach(alarm => {
      if (alarm.status === 'active') {
        this.alarmManager.createAlarm(alarm.station, alarm.radius, alarm.soundType);
      }
    });
    
    // UIを初期化
    this.initUI();
    
    // 位置追跡の開始
    this.locationTracker.addCallback((position) => {
      this.updateCurrentPosition(position);
      this.alarmManager.checkAlarms(position);
    });
    
    // 通知の許可をリクエスト
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    console.log('App initialized');
  }

  /**
   * UIを初期化
   */
  initUI() {
    // ビューの切り替え
    document.getElementById('nav-home').addEventListener('click', () => this.showView('home'));
    document.getElementById('nav-search').addEventListener('click', () => this.showView('search'));
    document.getElementById('nav-settings').addEventListener('click', () => this.showView('settings'));
    
    // 位置追跡の開始/停止
    document.getElementById('toggle-tracking').addEventListener('click', () => this.toggleTracking());
    
    // 駅検索
    document.getElementById('station-search-input').addEventListener('input', (e) => {
      this.searchStations(e.target.value);
    });
    
    // アラーム設定の保存
    document.getElementById('save-alarm').addEventListener('click', () => this.saveAlarm());
    document.getElementById('cancel-alarm').addEventListener('click', () => this.showView('home'));
    
    // 設定の保存
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    
    // 初期表示
    this.showView('home');
    this.updateAlarmList();
  }

  /**
   * ビューを切り替え
   * @param {string} view - 表示するビュー名
   */
  showView(view) {
    this.currentView = view;
    
    // すべてのビューを非表示
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    
    // 選択されたビューを表示
    document.getElementById(`${view}-view`).classList.remove('hidden');
    
    // ナビゲーションの状態を更新
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`nav-${view}`).classList.add('active');
  }

  /**
   * 位置追跡の開始/停止を切り替え
   */
  toggleTracking() {
    const button = document.getElementById('toggle-tracking');
    
    if (this.locationTracker.isTracking) {
      this.locationTracker.stopTracking();
      button.textContent = '位置追跡を開始';
      button.classList.remove('btn-danger');
      button.classList.add('btn-primary');
    } else {
      this.locationTracker.startTracking();
      button.textContent = '位置追跡を停止';
      button.classList.remove('btn-primary');
      button.classList.add('btn-danger');
    }
  }

  /**
   * 現在位置を更新
   * @param {Object} position - 位置情報
   */
  updateCurrentPosition(position) {
    document.getElementById('current-lat').textContent = position.latitude.toFixed(6);
    document.getElementById('current-lng').textContent = position.longitude.toFixed(6);
    document.getElementById('current-accuracy').textContent = Math.round(position.accuracy);
    
    // アクティブなアラームとの距離を更新
    const activeAlarms = this.alarmManager.getActiveAlarms();
    activeAlarms.forEach(alarm => {
      const distance = this.distanceCalculator.calculateDistance(
        position.latitude,
        position.longitude,
        alarm.station.latitude,
        alarm.station.longitude
      );
      
      const element = document.getElementById(`alarm-distance-${alarm.id}`);
      if (element) {
        element.textContent = this.distanceCalculator.formatDistance(distance);
      }
    });
  }

  /**
   * 駅を検索
   * @param {string} query - 検索クエリ
   */
  async searchStations(query) {
    if (!query || query.length < 2) {
      document.getElementById('search-results').innerHTML = '';
      return;
    }
    
    const results = await this.stationSearcher.searchByName(query);
    this.displaySearchResults(results);
  }

  /**
   * 検索結果を表示
   * @param {Array} stations - 駅のリスト
   */
  displaySearchResults(stations) {
    const resultsContainer = document.getElementById('search-results');
    
    if (stations.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">駅が見つかりませんでした</div>';
      return;
    }
    
    resultsContainer.innerHTML = stations.map(station => `
      <div class="station-item" data-station-id="${station.id}">
        <div class="station-name">${station.name}</div>
        <div class="station-info">${station.line} - ${station.prefecture}</div>
      </div>
    `).join('');
    
    // 駅選択のイベントリスナーを追加
    resultsContainer.querySelectorAll('.station-item').forEach(item => {
      item.addEventListener('click', () => {
        const stationId = item.dataset.stationId;
        const station = stations.find(s => s.id === stationId);
        this.selectStation(station);
      });
    });
  }

  /**
   * 駅を選択してアラーム設定画面を表示
   * @param {Object} station - 選択された駅
   */
  selectStation(station) {
    this.selectedStation = station;
    
    document.getElementById('selected-station-name').textContent = station.name;
    document.getElementById('selected-station-info').textContent = 
      `${station.line} - ${station.prefecture}`;
    
    // デフォルト値を設定
    document.getElementById('alarm-radius').value = this.settings.defaultRadius;
    document.getElementById('alarm-sound').value = this.settings.soundType;
    
    this.showView('alarm-setup');
  }

  /**
   * アラームを保存
   */
  async saveAlarm() {
    if (!this.selectedStation) return;
    
    const radius = parseInt(document.getElementById('alarm-radius').value);
    const soundType = document.getElementById('alarm-sound').value;
    
    const alarm = this.alarmManager.createAlarm(this.selectedStation, radius, soundType);
    await this.storageManager.saveAlarm(alarm);
    
    this.updateAlarmList();
    this.showView('home');
    
    // 位置追跡を開始していない場合は開始
    if (!this.locationTracker.isTracking) {
      this.toggleTracking();
    }
  }

  /**
   * アラームリストを更新
   */
  updateAlarmList() {
    const alarms = this.alarmManager.getActiveAlarms();
    const listContainer = document.getElementById('alarm-list');
    
    if (alarms.length === 0) {
      listContainer.innerHTML = '<div class="no-alarms">アクティブなアラームはありません</div>';
      return;
    }
    
    listContainer.innerHTML = alarms.map(alarm => `
      <div class="alarm-card" id="alarm-${alarm.id}">
        <div class="alarm-header">
          <div class="alarm-station">${alarm.station.name}駅</div>
          <button class="btn-delete" data-alarm-id="${alarm.id}">削除</button>
        </div>
        <div class="alarm-details">
          <div class="alarm-line">${alarm.station.line}</div>
          <div class="alarm-radius">通知範囲: ${alarm.radius}m</div>
          <div class="alarm-distance">
            現在地からの距離: <span id="alarm-distance-${alarm.id}">計算中...</span>
          </div>
        </div>
      </div>
    `).join('');
    
    // 削除ボタンのイベントリスナーを追加
    listContainer.querySelectorAll('.btn-delete').forEach(button => {
      button.addEventListener('click', async () => {
        const alarmId = button.dataset.alarmId;
        this.alarmManager.deleteAlarm(alarmId);
        await this.storageManager.deleteAlarm(alarmId);
        this.updateAlarmList();
      });
    });
  }

  /**
   * 設定を保存
   */
  saveSettings() {
    this.settings = {
      volume: parseFloat(document.getElementById('setting-volume').value),
      soundType: document.getElementById('setting-sound').value,
      updateInterval: parseInt(document.getElementById('setting-interval').value),
      defaultRadius: parseInt(document.getElementById('setting-radius').value),
      theme: document.getElementById('setting-theme').value
    };
    
    this.storageManager.saveSettings(this.settings);
    
    // テーマを適用
    document.body.className = this.settings.theme === 'dark' ? 'dark-theme' : '';
    
    alert('設定を保存しました');
  }
}

// アプリケーションを起動
const app = new GeoStationApp();
app.init();
