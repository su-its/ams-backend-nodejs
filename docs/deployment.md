# Deployment

## PM2のインストール（まだの場合）

```bash
npm install pm2 -g
```

## 新しくリリースする場合

```bash
cd /path/to/projectdir/
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## PM2 について

PM2 は OS の起動時に本リポジトリ、 ams-backend のプログラムを自動起動させ、落ちたら再起動させるなどの処理を担当しています。

詳しくは公式ドキュメントを読んでください。

[PM2 - Single Page Doc](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)

### PM2でプログラムを自動起動させる流れ

- `pm2 start <何か>` を使用して、 1 つ以上の自動起動させたいスクリプトを実行させた状態にしておきます。
- `pm2 save` を実行します。すると現在のステータスが `~/.pm2/dump.pm2` に保存されます。
- `pm2 startup` を実行すると PM2 が systemd のデーモンとして登録されます( Debian GNU/Linux 系の OS の場合)。
  - これは、 OS の起動時に `~/.pm2/dump.pm2` を読み込んで終了前の状態を復元するというしくみになっています。
  - `pm2 startup` は PM2 自体のインストール時に一度実行すれば大丈夫です。

---

### 設定ファイル

ams-backend のプログラムを実行させるため PM2 に読み込ませる使用する設定ファイルは `ecosystem.config.js` です。

> PM2 そのものの設定ファイルではありません。プロジェクトごとに任意の設定ファイルを書いて PM2 に実行させることができます。

意味は次の通りです。

```javascript
module.exports = {
  apps : [{
    name: 'ams-backend', // PM2 内での識別名
    script: 'npm',       // これと
    args: 'start',       // これのセットでpackage.jsonのnpm startが実行される
    watch: false,        // デーモンが起動しているときコードが更新されても再起動しない。再起動は手動でやる
    restart_delay: 1000, // エラーで止まった時に再起動するまでの待機時間は1000ミリ秒
    log_date_format: 'YYYY-MM-DD HH:mm Z', // ログの日付フォーマットの指定。下記の例を参照
    merge_logs: true     // ログを1つのファイルにまとめる
  }] // appsプロパティにさらにアプリを追加してもよい
}
```

---

### ログ

ロガーに特別なものは使用していません。

標準出力 `console.log` は ams-backend-out.log に、標準エラー出力 `console.error` は ams-backend-error.log にそれぞれ保存されます。

また、これらのログは `~/.pm2/logs/` 以下に保存されます。

以下にログの例を載せます。

- ams-backend-out.log

```plain
2021-03-13 10:48 +09:00: > ams-backend@2.0.1 build /home/pi/ams-projects/ams-backend
2021-03-13 10:48 +09:00: > tsc -p .
2021-03-13 10:48 +09:00:
2021-03-13 10:48 +09:00: [*] Server is running on port 3000.
```

- ams-backend-error.log

```plain
2021-03-13 10:48 +09:00: Error: Connection lost: The server closed the connection.
2021-03-13 10:48 +09:00:     at Socket.<anonymous> (/home/pi/ams-projects/ams-backend/node_modules/mysql2/lib/connection.js:91:31)
2021-03-13 10:48 +09:00:     at Socket.emit (events.js:315:20)
2021-03-13 10:48 +09:00:     at TCP.<anonymous> (net.js:673:12)
2021-03-13 10:48 +09:00: Emitted 'error' event on Connection instance at:
2021-03-13 10:48 +09:00:     at Connection._notifyError (/home/pi/ams-projects/ams-backend/node_modules/mysql2/lib/connection.js:225:12)
2021-03-13 10:48 +09:00:     at Socket.<anonymous> (/home/pi/ams-projects/ams-backend/node_modules/mysql2/lib/connection.js:97:12)
2021-03-13 10:48 +09:00:     at Socket.emit (events.js:315:20)
2021-03-13 10:48 +09:00:     at TCP.<anonymous> (net.js:673:12) {
2021-03-13 10:48 +09:00:   fatal: true,
2021-03-13 10:48 +09:00:   code: 'PROTOCOL_CONNECTION_LOST'
2021-03-13 10:48 +09:00: }
```

---

### デバッグ

デバッグをするときは直接 npm スクリプトを実行するか、PM2 が ams-backend を走らせている状態でログを監視するのがよいでしょう。

直接 npm スクリプトを実行して出力を監視する場合は次の手順です。

```bash
cd /path/to/projectdir/
npm run start
```

PM2 の吐くログを監視する場合は次の手順です。

```bash
tail -f --retry ~/.pm2/logs/ams-out.log
#または
tail -f --retry ~/.pm2/logs/ams-error.log
```

---

### PM2 自体のアップデート

PM2 のアップデートは次のコマンドで実行できます。

```bash
pm2 update
```

---

### npm および Node.js のアップデート時の注意

PM2 はグローバルインストールされているので npm あるいは Node.js のバージョンを上げると PM2 は削除されます。

この場合でも `~/.pm2/dump.pm2` は残るので古いバージョンの PM2 の設定で起動しようとして失敗します。

> nvm 等の Node.js のバージョン管理システムを利用しているとバージョンを上げると Node.js の実行ファイルの参照先が変わります。そして `~/.pm2/dump.pm2` 内には絶対パスで Node.js の実行ファイルの場所を記述してある箇所があるのでコケます。

もしそうなっても古いバージョンの npm にインストールされている PM2 で作成された `dump.pm2` ファイルが新しい npm 環境で読めなくなるわけではありません。

`pm2 status` で必要な状態を確認できます。

npm または Node.js のアップデートに伴って必要な操作を示していますので、下記の手順を実行してください。

```bash
# npm または Node.js のバージョンを上げる前に行う操作
pm2 status # 現在自動起動するように登録されているスクリプトの一覧が出るので確認してメモしておく

pm2 delete all # この操作を行うと現在自動起動するように登録されているスクリプトの情報が消える
pm2 save --force # ~/.pm2/dump.pm2 が空になる
cat ~/.pm2/dump.pm2 # 空の配列が記入されていることを確認する
pm2 unstartup # PM2 のデーモンを止める。 sudo で始まるコマンドをコピペするように指示されるので指示に従う

# ここで npm または Node.js のバージョンを上げる(割愛)

# npm または Node.js のバージョンを上げた後に行う操作
npm install -g pm2 # PM2の再インストール。~/.pm2/ディレクトリには古いファイルが残っているがそのまま残しておく
pm2 start ecosystem.config.js # ams-backend はこれで再び使えるようになる
# 他にも自動起動させたいスクリプトがあれば start を繰り返す
tail ~/.pm2/logs/ams-backend-error.log # エラーが出ていないか確認する。起動できないなどのエラーは今までの手順を確認する
pm2 save # 現在の状態が~/.pm2/dump.pm2に書き込まれる。古いファイルの内容はは自動的に ~/.pm2/dump.pm2.bak に移動される
pm2 startup # unstartup のときと同じようにコマンドをコピペして実行すれば完了
```

### 注意点

`config.ts` および `node_modules` フォルダを上書き・削除しないように注意してください。


## 定時リセットについて
同梱のスクリプト `./getout.sh` を定時に実行すると指定した時刻での退室処理が実現できます。

### crontab の設定
このスクリプトを定時に実行するには crontab を使用します。

1. `pi` でログインしていることを確認する
2. `crontab -e` を実行し設定ファイルを開く(ここに定時実行したいコマンドを書きます)
3. 以下の内容を追記する
  ```plain
  0 0 * * * sh /home/pi/ams-project/ams-backend/getout.sh
  ```
4. ファイルを保存して終了する

このように設定すると、毎日 0:00 時点で退室処理がされていない人の退室処理が行われます。

