/**
 * 駅検索モジュール
 * HeartRails Express APIを使用して駅情報を検索
 */
export class StationSearcher {
  constructor() {
    // HeartRails Express API (無料)
    this.apiEndpoint = 'https://express.heartrails.com/api/json';
    this.cache = new Map();
  }

  /**
   * 駅名で検索
   * @param {string} stationName - 駅名
   * @returns {Promise<Array>} 検索結果の駅リスト
   */
  async searchByName(stationName) {
    if (!stationName || stationName.trim() === '') {
      return [];
    }

    const cacheKey = `name_${stationName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.apiEndpoint}?method=getStations&name=${encodeURIComponent(stationName)}`
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      if (data.response && data.response.station) {
        const stations = Array.isArray(data.response.station) 
          ? data.response.station 
          : [data.response.station];
        
        const formattedStations = stations.map(station => this.formatStation(station));
        this.cache.set(cacheKey, formattedStations);
        return formattedStations;
      }

      return [];
    } catch (error) {
      console.error('Station search error:', error);
      return [];
    }
  }

  /**
   * 路線名で検索
   * @param {string} lineName - 路線名
   * @returns {Promise<Array>} 検索結果の駅リスト
   */
  async searchByLine(lineName) {
    if (!lineName || lineName.trim() === '') {
      return [];
    }

    const cacheKey = `line_${lineName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.apiEndpoint}?method=getStations&line=${encodeURIComponent(lineName)}`
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      if (data.response && data.response.station) {
        const stations = Array.isArray(data.response.station) 
          ? data.response.station 
          : [data.response.station];
        
        const formattedStations = stations.map(station => this.formatStation(station));
        this.cache.set(cacheKey, formattedStations);
        return formattedStations;
      }

      return [];
    } catch (error) {
      console.error('Line search error:', error);
      return [];
    }
  }

  /**
   * 現在地周辺の駅を検索
   * @param {number} latitude - 緯度
   * @param {number} longitude - 経度
   * @param {number} radius - 検索半径（メートル）
   * @returns {Promise<Array>} 周辺駅のリスト
   */
  async searchNearby(latitude, longitude, radius = 5000) {
    // HeartRails APIは座標による検索をサポートしていないため、
    // すべての駅から距離計算で絞り込む必要がある
    // 実装の簡略化のため、主要な駅のみを返すか、
    // 別のAPIを使用する必要がある
    console.log('Nearby search not fully implemented with HeartRails API');
    return [];
  }

  /**
   * 駅情報をフォーマット
   * @param {Object} station - API からの駅情報
   * @returns {Object} フォーマットされた駅情報
   */
  formatStation(station) {
    return {
      id: `${station.line}_${station.name}`,
      name: station.name,
      latitude: parseFloat(station.y),
      longitude: parseFloat(station.x),
      line: station.line,
      prefecture: station.prefecture || '',
      postal: station.postal || ''
    };
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.cache.clear();
  }
}
