# line-reserve-spreadsheet

LINEで予約・スプレッドシートで管理ができるアプリケーションのリポジトリ

以下をREADME.mdに追加

## プロジェクトの開始

### 必要パッケージのインストール

`npm install typescript dotenv @types/google-apps-script type-fest`

### claspの設定

`touch .clasp.json`
`touch .claspignore`
`touch appsscript.json`

### .clasp.jsonの設定

```json:clasp.json
{
    "_scriptFileName":"スクリプトファイル名を入力",
    "_relationalSpreadSheet": "スプレッドシートファイル名を入力",
    "scriptId":"スクリプトIDを入力",
    "rootDir":"/Users/koiketakuma/Documents/GitHub/ディレクトリ名"
}
```

### .claspignoreの設定

```.claspignore
**.vscode/**
**node_modules/**
```

### appsscript.jsonの設定

```json:appsscript.json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {
  },
  "webapp": {
    "access": "MYSELF",
    "executeAs": "USER_DEPLOYING"
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

### .gitignoreの設定

.vscode/
node_modules/
.gitignore
.env
.clasp.json
.claspignore

## 利用環境

- Typescript
- Clasp
- Google apps script

## 関連スプレッドシート

## Todo
