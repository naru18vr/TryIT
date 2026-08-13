# Initial Catalog Research Notes

## Official source

- Channel: https://www.youtube.com/channel/UCcj-cHmS0uD91MLjtdiN89Q
- Channel handle: `@TryIT_official`
- The channel presents both junior-high and high-school learning videos across science, social studies, mathematics, English, and classical Japanese.

## Verified sample videos and courses

| Subject | Unit | Video ID | Verified title / course |
| --- | --- | --- | --- |
| 化学基礎 | 物質の変化 | `GEjtSrSaFjc` | Composition of Matter 01: Pure Substances and Mixtures |
| 化学基礎 | 物質の変化 | `ZOYzaEuCv8k` | 物質量の定義 |
| 化学基礎 | 物質の変化 | `zY7n7m2bs00` | モル質量の求め方 |
| 化学基礎 | 物質の変化 | `PhOBK9EVSlw` | 酸化剤還元反応式 |
| 世界史 | 先史時代 | `Zfp5cUEkeek` | 人類の出現と進化 |
| 世界史 | 古代オリエント | `DZaSr9KVCR8` | Ancient Orient 1: Mesopotamia |
| 高校生物 | 動物生理 | `8W6R78RiykY` | 高校生物 動物生理 |
| 高校生物 | 分類 | `rt5isvQ-LPY` | 高校生物 分類 |
| 高校生物 | 進化 | `l6xaX83omro` | 高校生物 進化 |
| 高校生物 | 生態 | `k92g9ORjJBM` | 高校生物 生態 |
| 高校生物 | 植物生理 | `VlZebv_-CBQ` | 高校生物 植物生理 |
| 高校生物 | 動物の発生 | `0gJLgHWmo2k` | 高校生物 動物の発生 |

## Implementation decision

The first release uses this verified subset as the built-in catalog. The data model stores the YouTube ID, subject, unit, summary, and key points independently, so a later YouTube Data API sync can add the channel's remaining videos without changing viewing-history or progress logic.
