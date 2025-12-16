# geo-station

位置情報を取得して、指定した駅に近づいたらアラームが鳴るWebアプリ

## 概要

geo-stationは、ユーザーの現在位置を追跡し、指定した駅に近づいたときに自動的にアラームを鳴らすWebアプリケーションです。電車で移動中に寝過ごしを防ぎたい方や、目的地到着の通知を受け取りたい方に最適なソリューションです。

## 主な機能

- 📍 **リアルタイム位置追跡**: Geolocation APIを使用してユーザーの現在位置を継続的に取得
- 🚉 **駅検索機能**: 目的地の駅を名前や路線で検索
- 🔔 **近接アラーム**: 指定した駅に設定した距離内に入るとアラームが鳴動
- 🎵 **カスタマイズ可能なアラーム音**: 複数のアラーム音から選択可能
- 📱 **PWA対応**: オフラインでも動作し、ホーム画面に追加可能
- 🔕 **バックグラウンド動作**: 画面をオフにしてもアラーム機能が継続

## システム設計

### アーキテクチャ概要

```
┌─────────────────────────────────────────────────────┐
│                   クライアント層                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          Webブラウザ (PWA)                   │  │
│  │  ┌────────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │  │   UI層     │  │ Service  │  │ IndexedDB│ │  │
│  │  │  (React/   │  │  Worker  │  │  (ローカル│ │  │
│  │  │   Vue)     │  │          │  │   保存)  │ │  │
│  │  └────────────┘  └──────────┘  └─────────┘ │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                 ブラウザAPI層                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │ Geolocation  │  │  Web Audio   │  │ Wake Lock│  │
│  │     API      │  │     API      │  │   API    │  │
│  └──────────────┘  └──────────────┘  └─────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                   APIサーバー層                      │
│  ┌──────────────────────────────────────────────┐  │
│  │         RESTful API (Optional)               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │  駅情報  │  │  路線情報 │  │ ユーザー  │  │
│  │  │   API    │  │   API    │  │   API    │  │
│  │  └──────────┘  └──────────┘  └──────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────┐
│                  外部サービス層                      │
│  ┌──────────────┐  ┌──────────────┐               │
│  │  駅データAPI  │  │   地図API    │               │
│  │ (駅すぱあと等)│  │(Google Maps) │               │
│  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────┘
```

### 技術スタック

#### フロントエンド
- **フレームワーク**: React / Vue.js / Vanilla JavaScript
- **状態管理**: Redux / Vuex / Context API
- **スタイリング**: CSS Modules / Tailwind CSS / Styled Components
- **PWA**: Workbox / Service Worker API
- **ビルドツール**: Vite / Webpack / Parcel

#### API・データソース
- **駅データ**: 
  - 駅すぱあとWebサービス
  - HeartRails Express API (無料)
  - 国土交通省オープンデータ
- **地図表示**: 
  - Google Maps API
  - Leaflet + OpenStreetMap
  - Mapbox

#### データ保存
- **IndexedDB**: アラーム設定、駅情報のキャッシュ
- **LocalStorage**: ユーザー設定（音量、アラーム音など）

### コアコンポーネント

#### 1. 位置情報取得モジュール (LocationTracker)
```javascript
class LocationTracker {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.callbacks = [];
  }
  
  startTracking(options = {}) {
    // Geolocation APIでリアルタイム位置取得
    // 高精度モード、更新間隔の設定
  }
  
  stopTracking() {
    // 位置追跡の停止
  }
  
  getCurrentPosition() {
    // 現在位置を返す
  }
}
```

**機能**:
- `navigator.geolocation.watchPosition()` を使用した継続的な位置監視
- 精度と電池消費のバランス調整
- エラーハンドリング（権限拒否、タイムアウト等）

#### 2. 距離計算モジュール (DistanceCalculator)
```javascript
class DistanceCalculator {
  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine公式で2点間の距離を計算
    // 返り値: メートル単位の距離
  }
  
  isWithinRadius(currentPos, targetPos, radius) {
    // 指定した半径内にいるかチェック
  }
}
```

**機能**:
- Haversine公式による高精度な距離計算
- 地球の曲率を考慮した計算

#### 3. アラーム管理モジュール (AlarmManager)
```javascript
class AlarmManager {
  constructor() {
    this.alarms = [];
    this.audioContext = null;
  }
  
  createAlarm(stationInfo, radius, soundType) {
    // 新しいアラームを作成
  }
  
  checkAlarms(currentPosition) {
    // 現在位置と各アラームの距離をチェック
    // トリガー条件を満たしたらアラームを鳴動
  }
  
  triggerAlarm(alarm) {
    // Web Audio APIでアラーム音を再生
    // バイブレーション（対応デバイスのみ）
    // 通知の表示
  }
  
  stopAlarm(alarmId) {
    // アラームの停止
  }
}
```

**機能**:
- 複数のアラームを同時管理
- アラーム状態の管理（待機中、トリガー済み、停止等）
- 音声再生（Web Audio API）
- バイブレーション（Vibration API）
- プッシュ通知（Notification API）

#### 4. 駅検索モジュール (StationSearcher)
```javascript
class StationSearcher {
  constructor(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
    this.cache = new Map();
  }
  
  searchByName(stationName) {
    // 駅名で検索
  }
  
  searchByLine(lineName) {
    // 路線名で検索
  }
  
  searchNearby(latitude, longitude, radius) {
    // 現在地周辺の駅を検索
  }
  
  getStationDetails(stationId) {
    // 駅の詳細情報を取得
  }
}
```

**機能**:
- 駅名・路線名での検索（インクリメンタルサーチ対応）
- 現在地周辺の駅表示
- 検索結果のキャッシング
- オフライン対応（事前にダウンロードした駅データを使用）

#### 5. データ永続化モジュール (StorageManager)
```javascript
class StorageManager {
  async saveAlarm(alarm) {
    // IndexedDBにアラームを保存
  }
  
  async loadAlarms() {
    // 保存されたアラームを読み込み
  }
  
  async deleteAlarm(alarmId) {
    // アラームを削除
  }
  
  saveSettings(settings) {
    // LocalStorageに設定を保存
  }
  
  loadSettings() {
    // 設定を読み込み
  }
}
```

**機能**:
- IndexedDBによる構造化データの保存
- LocalStorageによる設定の保存
- データのバックアップ・復元機能

### データフロー

#### アラーム設定フロー
```
1. ユーザーが駅を検索
   ↓
2. StationSearcher が駅情報APIを呼び出し
   ↓
3. 検索結果を表示
   ↓
4. ユーザーが駅を選択し、アラーム設定
   ↓
5. AlarmManager がアラームを作成
   ↓
6. StorageManager が IndexedDB に保存
   ↓
7. LocationTracker が位置追跡を開始
```

#### アラーム監視・実行フロー
```
1. LocationTracker が定期的に現在位置を取得
   ↓
2. AlarmManager が各アラームをチェック
   ↓
3. DistanceCalculator で距離を計算
   ↓
4. 設定半径内に入ったか判定
   ↓
5. 条件を満たした場合:
   a. triggerAlarm() を実行
   b. 音声再生（Web Audio API）
   c. バイブレーション（Vibration API）
   d. 通知表示（Notification API）
   e. UIに通知状態を反映
   ↓
6. ユーザーがアラームを停止
   ↓
7. アラーム状態を更新（使用済みまたは削除）
```

### UI/UX設計

#### 画面構成

1. **ホーム画面**
   - 現在地の表示（地図上）
   - アクティブなアラーム一覧
   - 新規アラーム作成ボタン
   - 現在地から目的地までの距離表示

2. **駅検索画面**
   - 検索バー（駅名・路線名）
   - 検索候補のリスト
   - 周辺駅表示ボタン
   - 最近使用した駅

3. **アラーム設定画面**
   - 選択した駅の情報
   - 通知距離の設定（スライダー: 100m〜5km）
   - アラーム音の選択
   - バイブレーションのON/OFF
   - 保存ボタン

4. **設定画面**
   - アラーム音量調整
   - 位置情報更新間隔
   - 省電力モード設定
   - データキャッシュの管理
   - プライバシー設定

#### レスポンシブデザイン
- モバイルファースト設計
- タブレット・デスクトップ対応
- ダークモード対応

### API仕様

#### 駅検索API (例)
```
GET /api/stations/search?q={query}&limit={limit}

レスポンス:
{
  "stations": [
    {
      "id": "station_001",
      "name": "東京",
      "name_kana": "とうきょう",
      "latitude": 35.681236,
      "longitude": 139.767125,
      "lines": [
        {"name": "JR山手線", "id": "line_001"},
        {"name": "JR中央線", "id": "line_002"}
      ],
      "prefecture": "東京都"
    }
  ]
}
```

#### 周辺駅検索API (例)
```
GET /api/stations/nearby?lat={latitude}&lng={longitude}&radius={radius}

レスポンス:
{
  "stations": [...],
  "total": 10
}
```

### セキュリティとプライバシー

#### 位置情報の取り扱い
- **位置情報の送信**: 基本的にサーバーに送信しない（クライアント側で完結）
- **権限管理**: ユーザーの明示的な許可を必要とする
- **データ保持**: 位置履歴は保存せず、必要最小限のデータのみ保持

#### データ保護
- **ローカルストレージ**: 機密情報は暗号化して保存
- **HTTPS通信**: すべての通信を暗号化
- **オフライン機能**: 外部通信を最小限に抑える

#### 権限管理
- **位置情報**: `navigator.permissions.query({name: 'geolocation'})`
- **通知**: `Notification.requestPermission()`
- **バックグラウンド実行**: Wake Lock APIの適切な使用

### パフォーマンス最適化

#### 電池消費の最適化
- **適応型更新間隔**: 移動速度に応じて位置情報の更新頻度を調整
- **低電力モード**: 精度を下げて更新間隔を延ばす
- **スリープ時の処理**: 画面オフ時は最小限の処理のみ実行

#### データ通信の最適化
- **駅データのキャッシング**: 使用頻度の高い駅データをローカルに保存
- **差分更新**: 駅データの更新は差分のみ取得
- **オフライン優先**: Service Workerでオフライン動作を実現

#### レンダリング最適化
- **仮想スクロール**: 大量の駅リスト表示時に使用
- **遅延読み込み**: 地図コンポーネントの遅延ロード
- **メモ化**: React.memo / Vue computed で不要な再レンダリングを防止

### エラーハンドリング

#### 位置情報取得エラー
- **PERMISSION_DENIED**: 権限要求ダイアログを表示
- **POSITION_UNAVAILABLE**: GPSオフの案内を表示
- **TIMEOUT**: リトライ処理と代替手段の提示

#### ネットワークエラー
- **オフライン時**: キャッシュデータの使用
- **API障害**: エラーメッセージと再試行ボタンの表示
- **タイムアウト**: 適切な待機時間設定とフォールバック

### テスト戦略

#### ユニットテスト
- 各モジュールの個別テスト
- 距離計算の精度テスト
- アラームトリガー条件のテスト

#### 統合テスト
- 位置情報取得からアラーム鳴動までの一連のフロー
- オフライン動作のテスト
- 複数アラームの同時動作テスト

#### E2Eテスト
- 実際のユーザーシナリオに基づいたテスト
- 異なるデバイスでの動作確認
- 位置情報シミュレーションを使用したテスト

### デプロイメント

#### 静的ホスティング
- **GitHub Pages**: 無料で簡単にデプロイ
- **Netlify / Vercel**: 自動デプロイとプレビュー機能
- **Cloudflare Pages**: 高速なCDN配信

#### CI/CDパイプライン
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 今後の拡張機能

#### Phase 2
- 🗺️ **経路表示**: 現在地から目的地までのルート表示
- 📊 **統計機能**: 利用履歴や移動距離の記録
- 👥 **アカウント機能**: クラウド同期とマルチデバイス対応

#### Phase 3
- 🤝 **共有機能**: アラーム設定の友人との共有
- 🌐 **多言語対応**: 英語、中国語、韓国語など
- 🚇 **交通機関連携**: 遅延情報や運行状況の統合

#### Phase 4
- 🤖 **AI提案機能**: よく使う駅の学習と自動提案
- ⌚ **ウェアラブル対応**: Apple Watch、Android Wearとの連携
- 🔊 **音声操作**: 音声コマンドでのアラーム設定

## 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/2z299/geo-station.git
cd geo-station

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test
```

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 参考リンク

- [Geolocation API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Geolocation_API)
- [Service Worker API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Service_Worker_API)
- [Web Audio API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API)
- [PWA - Google Developers](https://web.dev/progressive-web-apps/)
- [IndexedDB - MDN](https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API)
