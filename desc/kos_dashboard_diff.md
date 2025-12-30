# KOS 仪表盘导出 PPT 规范对比

## 字体 / 字号 / 粗细

| 板块 | 规范要求 | 当前实现 | 差异说明 |
| --- | --- | --- | --- |
| 标题 `Retail Dashboard` | FarnhamDisplay Regular 28pt | Microsoft YaHei 24pt，加粗 | 字体与字号都偏小 |
| `Period` 标签 | FarnhamDisplay Regular 10.5pt，加粗 | Microsoft YaHei 12pt，常规 | 字体和粗细不符、字号偏大 |
| 日期 `2025.10.20 – 2025.10.26` | FarnhamDisplay Regular 10pt，常规 | Microsoft YaHei 12pt，常规 | 字体/字号不符，且与 Period 的间距更大 |
| `Page 1` | PingFang HK 8pt，常规 | 未渲染 | 页码缺失 |
| KPI 英文标题 | FarnhamDisplay Regular 9pt，常规 | Microsoft YaHei 8pt (`KPI_LABEL_FONT_SIZE`) | 字体不同且位置更靠上 |
| KPI 中文副标题 | FarnhamDisplay Regular 8pt，常规 | Microsoft YaHei 8pt | 字体不同 |
| KPI 数值 | FarnhamDisplay Regular 28pt，加粗 | Microsoft YaHei 28pt，加粗 | 字体不同，且缺少红/绿趋势箭头 |
| 趋势箭头 | 红▼ / 绿▲，FarnhamDisplay Regular 8pt 填充 | 未实现 | 功能与视觉都缺失 |
| `Weekly Top 3` 文案 | FarnhamDisplay LightItalic 11pt，常规 | Microsoft YaHei 13pt，加粗 | 字体、字号、字重都不同，且缺少粉色底条 |
| 表头（含中英） | FarnhamDisplay Regular 8pt，灰底（Turnover 列粉底） | Microsoft YaHei 8pt，加粗，灰/粉底 | 字号更小且字体不同 |
| 表体 | FarnhamDisplay Regular 11pt，常规 | Microsoft YaHei 10pt，常规 | 字体不同 |
| Turnover 列 | 整列粉底 #FFD4D4，金额右对齐 | 表头 #FFD4D4，数据 #FFE5E8 | 颜色更浅且表头/表体色值不一致 |

## 板块间距 / 尺寸

| 项目 | 规范标注 | 代码实现 | 差异说明 |
| --- | --- | --- | --- |
| 左侧页边距 → 第一列 KPI | 37px | `startX = 0.55"` ≈ 53px | 实现更靠右，偏移约 16px |
| 标题底部 → KPI 第一行 | 33px | `startY - 0.3"` ≈ 0.5" ≈ 48px | 实现留白更大 |
| 单个 KPI 卡片 | 168px × 113px | `cardW ≈ 142px`, `cardH ≈ 96px` | 卡片更窄、更矮 |
| KPI 行间距 | 19px | `gapY = 0.15"` ≈ 14px | 行间距更小 |
| KPI 区块底部 → Weekly Top | 120px | `topY - cardBottom ≈ 0.25"` ≈ 24px | 留白不足，块间更拥挤 |
| `Weekly Top 3` 区域 | 1045px × 148px（含粉色底条） | 表格宽 9" ≈ 864px，高约 134px，缺少底条 | 宽度缩窄、视觉层级缺失 |
| 表头高度 | 36px | `headerRowH = 0.38"` ≈ 36.5px | 高度匹配但缺少粉色分隔线 |
| 表底 → 页底 | 43px | 取决于数据行数，约 1.5" 留白 | 规范固定 43px，但实现不固定 |

> 以上差异基于 `pptx/page1_spec.png` 的标注与 `src/pages/RetailAnalysis.jsx` 中的导出实现对比整理。

