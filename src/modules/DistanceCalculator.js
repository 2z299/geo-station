/**
 * 距離計算モジュール
 * Haversine公式を使用して2点間の距離を計算
 */
export class DistanceCalculator {
  /**
   * 2点間の距離を計算（Haversine公式）
   * @param {number} lat1 - 地点1の緯度
   * @param {number} lon1 - 地点1の経度
   * @param {number} lat2 - 地点2の緯度
   * @param {number} lon2 - 地点2の経度
   * @returns {number} メートル単位の距離
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  }

  /**
   * 指定した半径内にいるかチェック
   * @param {Object} currentPos - 現在位置 {latitude, longitude}
   * @param {Object} targetPos - 目標位置 {latitude, longitude}
   * @param {number} radius - 半径（メートル）
   * @returns {boolean} 半径内にいる場合true
   */
  isWithinRadius(currentPos, targetPos, radius) {
    const distance = this.calculateDistance(
      currentPos.latitude,
      currentPos.longitude,
      targetPos.latitude,
      targetPos.longitude
    );
    return distance <= radius;
  }

  /**
   * 距離を人間が読みやすい形式にフォーマット
   * @param {number} meters - メートル単位の距離
   * @returns {string} フォーマットされた距離文字列
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }
}
