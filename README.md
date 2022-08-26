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

---

### TODO

- あるライブラリの関数を使用する際に、その関数の戻り値が複数（ここでは `string | number | boolean | undefined` とする）の場合、使用する側が `string` だけを許容したい場合はどう記述するのがベスト？
    > 戻り値を `toString()` して `undefined` の場合はから文字列( `''` )とする？
    > > `funcA()?.toString() || ''` みたいな？
