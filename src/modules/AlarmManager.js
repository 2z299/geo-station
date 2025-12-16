/**
 * アラーム管理モジュール
 * 複数のアラームを管理し、条件を満たしたらアラームを鳴動
 */
export class AlarmManager {
  constructor(distanceCalculator) {
    this.alarms = [];
    this.distanceCalculator = distanceCalculator;
    this.audioContext = null;
    this.currentAudio = null;
    this.wakeLock = null;
  }

  /**
   * 新しいアラームを作成
   * @param {Object} stationInfo - 駅情報
   * @param {number} radius - 通知半径（メートル）
   * @param {string} soundType - アラーム音のタイプ
   * @returns {Object} 作成されたアラーム
   */
  createAlarm(stationInfo, radius, soundType = 'default') {
    const alarm = {
      id: this.generateId(),
      station: stationInfo,
      radius: radius,
      soundType: soundType,
      status: 'active', // active, triggered, stopped
      createdAt: Date.now(),
      triggeredAt: null
    };
    
    this.alarms.push(alarm);
    console.log('Alarm created:', alarm);
    return alarm;
  }

  /**
   * 現在位置と各アラームの距離をチェック
   * @param {Object} currentPosition - 現在位置 {latitude, longitude}
   */
  checkAlarms(currentPosition) {
    if (!currentPosition) return;

    this.alarms.forEach(alarm => {
      if (alarm.status !== 'active') return;

      const isWithin = this.distanceCalculator.isWithinRadius(
        currentPosition,
        {
          latitude: alarm.station.latitude,
          longitude: alarm.station.longitude
        },
        alarm.radius
      );

      if (isWithin) {
        this.triggerAlarm(alarm);
      }
    });
  }

  /**
   * アラームを鳴動
   * @param {Object} alarm - アラーム情報
   */
  async triggerAlarm(alarm) {
    if (alarm.status !== 'active') return;

    alarm.status = 'triggered';
    alarm.triggeredAt = Date.now();
    
    console.log('Alarm triggered:', alarm);

    // 音声を再生
    await this.playSound(alarm.soundType);

    // バイブレーション
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // 通知を表示
    await this.showNotification(alarm);

    // Wake Lockを取得（画面をオンに保つ）
    await this.requestWakeLock();
  }

  /**
   * アラーム音を再生
   * @param {string} soundType - 音のタイプ
   */
  async playSound(soundType) {
    try {
      // Web Audio APIでアラーム音を再生
      const audioPath = `/geo-station/alarm-sounds/${soundType}.mp3`;
      this.currentAudio = new Audio(audioPath);
      this.currentAudio.loop = true;
      await this.currentAudio.play();
    } catch (error) {
      console.error('Failed to play sound:', error);
      // フォールバック: ビープ音を生成
      this.playBeep();
    }
  }

  /**
   * ビープ音を生成（フォールバック）
   */
  playBeep() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => oscillator.stop(), 1000);
    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  }

  /**
   * 通知を表示
   * @param {Object} alarm - アラーム情報
   */
  async showNotification(alarm) {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      new Notification('駅に近づきました！', {
        body: `${alarm.station.name}駅まであと${alarm.radius}m以内です`,
        icon: '/geo-station/icon-192x192.png',
        badge: '/geo-station/icon-192x192.png',
        tag: `alarm-${alarm.id}`,
        requireInteraction: true
      });
    }
  }

  /**
   * Wake Lockをリクエスト
   */
  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock acquired');
      }
    } catch (error) {
      console.error('Wake Lock error:', error);
    }
  }

  /**
   * アラームを停止
   * @param {string} alarmId - アラームID
   */
  stopAlarm(alarmId) {
    const alarm = this.alarms.find(a => a.id === alarmId);
    if (!alarm) return;

    alarm.status = 'stopped';

    // 音声を停止
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Wake Lockを解放
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }

    console.log('Alarm stopped:', alarm);
  }

  /**
   * アラームを削除
   * @param {string} alarmId - アラームID
   */
  deleteAlarm(alarmId) {
    this.stopAlarm(alarmId);
    this.alarms = this.alarms.filter(a => a.id !== alarmId);
    console.log('Alarm deleted:', alarmId);
  }

  /**
   * すべてのアラームを取得
   * @returns {Array} アラームの配列
   */
  getAlarms() {
    return this.alarms;
  }

  /**
   * アクティブなアラームを取得
   * @returns {Array} アクティブなアラームの配列
   */
  getActiveAlarms() {
    return this.alarms.filter(a => a.status === 'active');
  }

  /**
   * ユニークなIDを生成
   * @returns {string} ユニークID
   */
  generateId() {
    return `alarm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
