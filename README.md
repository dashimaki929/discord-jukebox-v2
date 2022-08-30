# discord-jukebox-v2

Discord Jukebox BOT🤖.  
Running on Node.js (in TypeScript)

---

## 実行方法

1. `/config/setting.example.json` を参考に `settings.json` を作成
2. 以下コマンドを実行

    ```
    # 初回起動時
    $ npm install

    $ npm start
    ```

---

## 環境構築メモ

### 環境情報

```
$ node -v
v16.14.2

$ npm -v
6.14.7
```

### インストール済みライブラリ

-   typescript
-   @types/node@16
    > `TypeScript v16` 用インテリセンス
-   ts-node
    > TypeScript を即時コンパイル、実行する
-   nodemon
    > ファイルの変更監視、変更時に `ts-node` を再起動する
    >
    > > 詳細な使用内容は `package.json` の `run-scripts` を参照
-   discord.js
    > [discord.js - Documentation](https://discord.js.org/#/docs/discord.js/main/general/welcome)  
    > [discord.js - Guide](https://discordjs.guide/)
-   @discordjs/voice
    > `discord.js` 音声操作用ライブラリ
-   @discordjs/opus
    > `discord.js` opus 音声再生用ライブラリ
-   ffmpeg
    > 動画と音声を記録・変換・再生用
-   ffmpeg-static
    > `ffmpeg` の依存関係周りを解消
-   tweetnacl
    > 暗号化ライブラリ, `discord.js` 上で音声を再生するために必須
-   ytdl-core
    > YouTube リソース取得用ライブラリ
-   discord-ytdl-core
    > `discord.js` 用に扱いやすくした `ytdl` の拡張ライブラリ。
    > > 内部で `ffmpeg` を使用した引数設定を実装している。
    > > > ダウンロードした音声を `Node v16` 環境でストリーミングするとストリームが中断される不具合有り。  
    > > > 動作安定化の観点からもローカルにキャッシュを作成して再生する方針で対応。
-   yt-search
    > YouTube 上の動画を文字列から検索、プレイリストの URL 取得を行うライブラリ
-   @types/yt-search
    > `yt-search` 用インテリセンス

### トラブルシューティング

-   ~~`sodium` のインストールに失敗した場合~~
    -   以下コマンドを実行
        ```
        npm install --global --production --add-python-to-path windows-build-tools
        ```

---

## TODO

-   あるライブラリの関数を使用する際に、その関数の戻り値が複数（ここでは `string | number | boolean | undefined` とする）の場合、使用する側が `string` だけを許容したい場合はどう記述するのがベスト？
    > 戻り値を `toString()` して `undefined` の場合はから文字列( `''` )とする？
    >
    > > `funcA()?.toString() || ''` みたいな？
    > > > `funcA()! as string` みたいな書き方がある

-   ライフサイクル
    - 音楽再生
        1. ローカルのプレイリストを参照（事前にリストはシャッフルしてキューを作成）
        2. ローカルにキャッシュがない楽曲の場合、ストリーミング再生を行う。
            - ストリーミング再生を行っているバックタスクでストリームをローカルに格納する。
            - この際、ffmpegによるラウドネス値の正規化を行う。
            - ストリーム時の音声にフィルターが掛かっていないこと点、考慮が必要。
        3. ローカルにキャッシュがある場合、そのままローカルの音源を再生する。

-   時報機能追加
-   ファイル容量が 0byte でダウンロードされてしまったファイルの削除
    > 時報のタイミングで 0byte を纏めて消す？
-   容量削減案考える