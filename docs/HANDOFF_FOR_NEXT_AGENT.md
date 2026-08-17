# Try IT 学習サポート：引き継ぎ文書

最終更新：2026-08-17（JST）  
対象リポジトリ：`https://github.com/naru18vr/TryIT`  
ローカルプロジェクト：`/home/ubuntu/tryit-learning-companion`

## 1. 目的と最重要ルール

このWebアプリは、Try IT公式YouTubeチャンネルの**正規授業動画のみ**を対象に、動画視聴、視聴履歴、動画ごとの詳細な予習・復習ノートを提供する。最終目標は、カタログ内の**全3,906本**へ、根拠確認済みの詳細ノートを追加することである。その後に、各動画へ選択式例題を標準5問追加する。

ノート作成では、Try IT公式のポイント・練習・チャレンジページ、公式ページの公開埋め込み動画ID、アプリ内カタログの動画タイトルを必ず照合する。要約には考え方・手順・理由・典型的な誤りを含め、覚えるポイントには必ず`復習では`で始まる確認観点を入れる。確認できない固有の例文、数値、解答は登録しない。

## 2. 現在の到達状況

| 区分 | 状態 | 補足 |
| --- | --- | --- |
| 全カタログ | 3,906本 | Try IT以外の告知・案内・対策動画は除外済み |
| 登録済みノート | 1,523本 | DB集計で確認済み |
| 中学2年生 | 171本・完了 | 詳細ノート登録・全件監査済み |
| 中学3年生 | 156本・完了 | 詳細ノート登録・全件監査済み |
| 中学1年生 | 199本・完了 | 詳細ノート登録・全件監査済み |
| 高校数学 I/A/II/B/III | 完了済み範囲あり | 詳細は`docs/note-batches/hs-detailed-notes-progress.md`を参照 |
| 高校英語文法：時制〜接続詞 | 完了済み範囲あり | 接続詞は19トピック・38本の最終監査済み |
| 高校英語文法：動詞 | **単元監査待ち** | 公式17トピック・正規動画34本を登録・検証済み |

### 動詞単元の直近完了範囲

| トピック | 完了本数 | 内容の中心 |
| --- | ---: | --- |
| 自動詞と他動詞 | 2本 | 目的語を直接取るか、前置詞を必要とするか |
| 他動詞と間違えやすい自動詞 | 2本 | `agree with`、`graduate from`、`participate in`、`apologize to 人 for ～` |
| 自動詞と間違えやすい他動詞 | 2本 | `leave`、`reach`、`oppose`、`attend`は前置詞を置かない |
| lieとlay / riseとraise | 2本 | 主語自身の動きか、目的語への働きかで自動詞・他動詞を判定 |
| pay / sell / read / last | 1本 | 他動詞と異なる自動詞用法、目的語の有無と主語の意味で判定 |
| stand / miss / have | 2本 | 目的語を取る他動詞用法とhave a + 動作名詞の定型を確認 |
| tell / say / speak / talk | 3本 | 内容・相手・話す行為と目的語・前置詞で使い分け |
| borrow / lend / rent / use | 2本 | 無料・有料、借り手・貸し手、語順で使い分け |
| forgive / permit / allow | 2本 | 謝罪への許しと行為への許可、for／to不定詞で使い分け |
| doubt / suspect | 2本 | 否定的な疑い・肯定的な疑い、否定形の意味で使い分け |
| suit / match / go with / fit | 2本 | 人・物・サイズのどれに合うかと、目的語・withで使い分け |
| make / have / let | 2本 | 強制・依頼・許可と、人 + 原形の形で使い分け |
| see / hear など | 2本 | 知覚の意味と、原形・現在分詞・過去分詞の形で使い分け |
| rob A of B / remind A of B | 2本 | A・of・Bの語順と、奪う型・結び付ける型で使い分け |
| prevent A from doing / distinguish A from B | 2本 | from + VingとA・from・Bの語順で使い分け |
| regard A as B / talk A into doing | 2本 | A・as・BとA・into・Vingの語順で使い分け |
| blame A for B / provide A with B | 2本 | A・for・BとA・with・Bの語順で使い分け |

直近の2動画は以下である。

| 動画ID | タイトル | 状態 |
| --- | --- | --- |
| `hTYSTmu3G0U` | 【高校 英語】 blame A for B など① （8分） | 登録・表示・検証済み |
| `eu1MCUCcW-I` | 【高校 英語】 blame A for B など② （8分） | 登録・DB検証済み |

## 3. 直近の品質確認結果

直近のblame A for B型・provide A with B型動詞2本は、Try IT公式のポイント・練習・チャレンジ、公開埋め込みID、カタログを照合済みである。blame／praise A for B、provide／supply／present A with B、A・Bの役割、present A with Bの受け身を含むノートを登録し、`hTYSTmu3G0U`の視聴ページで、YouTubeプレイヤー、要約、覚えるポイント、復習観点が表示されることを確認した。登録内容はSQLで2本とも必須語句・復習観点を含むことを確認し、2026-08-17時点でVitestは**6ファイル・24テストすべて成功**している。

表示確認には、`webdev_take_screenshot`が一時的にスピナーのままになる場合があった。この場合でも、再起動後にプレビューURLを直接開くと視聴ページとノート表示が確認できた。データ登録が完了しているかは必ずSQLで確認する。

## 4. 次に行う作業

高校英語文法「動詞」は、公式17トピック（正規動画34本）のノート登録・個別検証を完了した。次は、公式17トピックと34本を突合する単元全件監査を行う。

動詞単元の監査完了後は、公式一覧の次の残り単元である名詞・冠詞から順番に進める。

高校英語文法「動詞」完了後は、名詞・冠詞、代名詞、前置詞、形容詞・副詞、5文型、強調・倒置・挿入・省略・同格を進める。その後に、高校英語構文、高校理科、高校社会、高校国語を順に整備する。

## 5. ノート作成の標準手順

1. Try IT公式の単元ページ、練習、チャレンジを確認する。
2. 公式ページHTMLから公開埋め込み動画IDを抽出し、静的カタログと照合する。
3. 公式根拠、動画ID、タイトル、重要事項を`docs/note-batches/`へ保存する。
4. `videoNotes`へ`INSERT ... ON DUPLICATE KEY UPDATE`で、2本ずつ詳細ノートを登録する。
5. 登録数、`復習では`の有無、動画ごとの必須語句をSQLで検証する。
6. 代表動画の視聴ページでノート表示を確認する。
7. `pnpm test`を実行し、全テスト成功を確認する。
8. `docs/note-batches/hs-detailed-notes-progress.md`へ根拠・検証結果を追記する。
9. `todo.md`を確認してからチェックポイントを保存する。

### 再利用するコマンド

```bash
cd /home/ubuntu/tryit-learning-companion

# 動画IDからカタログを確認
ID='VIDEO_ID' npx tsx scripts/search-catalog-title.mjs

# タイトル・単元名からカタログを検索
QUERY='検索語' npx tsx scripts/search-catalog-title.mjs

# 公式ページから埋め込みIDを取得
curl -L --silent --show-error 'https://www.try-it.jp/chapters-XXXX/lessons-YYYY/' \
  | grep -oE '(youtube\.com/embed/|youtu\.be/|youtube\.com/watch\?v=)[A-Za-z0-9_-]{11}' \
  | head -10

# テスト
pnpm test
```

SQL登録の形は以下を維持する。`keyPoints`内は`・`で始め、改行を`\n`で区切る。

```sql
INSERT INTO videoNotes (videoId, summary, keyPoints, updatedByUserId) VALUES
('videoId', '詳細な要約', '・ポイント1\n・ポイント2\n・復習では〜', NULL)
ON DUPLICATE KEY UPDATE
  summary = VALUES(summary),
  keyPoints = VALUES(keyPoints),
  updatedByUserId = NULL,
  updatedAt = CURRENT_TIMESTAMP;
```

## 6. 主要ファイル

| パス | 役割 |
| --- | --- |
| `server/data/tryitCatalog.ts` | 全3,906本の静的カタログ |
| `server/routers.ts` | カタログ・ノート・視聴履歴のtRPCルーター |
| `server/db.ts` | DB操作ヘルパー |
| `drizzle/schema.ts` | `users`、`videoNotes`、`watchHistory`のスキーマ |
| `client/src/pages/Home.tsx` | 学年→教科→単元フィルターと動画一覧 |
| `client/src/pages/WatchVideo.tsx` | YouTube視聴、ノート、履歴記録 |
| `docs/note-batches/hs-detailed-notes-progress.md` | 高校課程の進捗・根拠・検証記録 |
| `scripts/search-catalog-title.mjs` | 動画ID・タイトルによるカタログ照合 |
| `scripts/prepare-note-batch.mjs` | 学年・単元・タイトル条件でのバッチ抽出 |
| `scripts/audit-grade-note-coverage.mjs` | 学年単位のノート監査 |
| `todo.md` | 全体の未完了作業履歴 |

## 7. アプリ構成と運用上の注意

React 19、TypeScript、Tailwind CSS 4、Express 4、tRPC 11、Drizzle ORM（MySQL/TiDB）を使用する。認証はManus OAuthで、視聴履歴はログインユーザーへ自動記録する。データベーススキーマを変更する場合は、スキーマ更新、Drizzleマイグレーション生成、SQL適用、テストの順に行う。

現時点では、ノート登録はDBデータの追加のみであり、アプリのロジック変更を伴わない。例題機能は**全動画のノート整備完了後**に着手する。標準5問（必須3問＋理解確認2問）を基本とし、回答後は正誤に関係なく正解・解説・復習観点を表示する仕様が既に決まっている。

## 8. 引き継ぎ時点のGit・停止情報

この文書を含む直近変更は、バッチ完了時にGitHubへ反映する。引き継ぎ先は作業開始時に`git status`と最新コミットを確認し、未コミット差分がないことを確認してから次の単元へ進む。

> まずは「動詞」公式17トピックに対応する正規動画34本をカタログから再抽出し、ノート・要約・復習観点が34本すべてに揃うことを監査してください。監査・表示確認・Vitest・進捗記録・保存・GitHub反映までを完結後、名詞・冠詞単元の最初のトピックへ進みます。品質基準を落とさず、この繰り返しを全動画まで続けることが最優先です。
