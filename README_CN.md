# LLM Wiki

[English](README.md)

基于 **Zotero + Claude Code + Obsidian** 的个人研究知识库。

Zotero 管理文献，Claude Code 负责阅读、摘要、交叉引用并维护结构化 wiki，Obsidian 提供图链接视图。所有内容以 markdown 存储、git 版本控制，并通过溯源模型追踪每条论断的来源。

## 架构

```
原始数据源（用户所有）  →  Claude Code（LLM 引擎）  →  Wiki（LLM 维护）
   Zotero 论文                  /kb-compile              sources/
   网页快照                     /kb-lint                  concepts/
   笔记 & PDF                   /kb-reflect               synthesis/
```

**三层架构：**

1. **原始数据源** (`raw/`) — 你的 Zotero 文献库、网页快照、笔记、PDF。你拥有这些数据，LLM 只读。
2. **Wiki** (`wiki/`) — 带溯源标记的结构化知识页面。LLM 创建和维护。
3. **Schema** (`CLAUDE.md`) — 管控 LLM 行为的规则、溯源等级和禁止操作。

**溯源模型** — 每个 wiki 页面和每条论断都有信任等级：

| 等级 | 含义 | 信任度 |
|---|---|---|
| `source-derived` | 直接从原始数据源提取 | 高 |
| `llm-derived` | 跨多个来源综合 | 中 |
| `user-verified` | 用户手动确认 | 最高 |
| `query-derived` | Q&A 生成（仅存于 `outputs/`） | 低 |

## 快速开始

### 前置条件

- 安装 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI
- 安装 [Zotero](https://www.zotero.org/) 及 [Better BibTeX](https://retorque.re/zotero-better-bibtex/) 插件（用于在线同步）
- Python 3.10+，安装 `pyzotero`（`pip install -r tools/requirements.txt`）
- [Obsidian](https://obsidian.md/)（可选，用于查看 wiki）

### 配置

```bash
git clone https://github.com/<your-username>/llm-wiki.git
cd llm-wiki
pip install -r tools/requirements.txt
```

在 Claude Code 中打开项目：

```bash
claude
```

### 工作流

1. **同步文献** — `/kb-sync` 从 Zotero 拉取论文到 `raw/zotero/papers/`
2. **编译** — `/kb-compile` 将原始文件处理为 `wiki/sources/` 摘要和 `wiki/concepts/` 文章
3. **检查** — `/kb-lint` 检查 wiki 健康状态：断链、缺失溯源、重复页面
4. **查询** — `/kb-ask <问题>` 搜索 wiki 并生成带引用的回答，存入 `outputs/`
5. **综合** — `/kb-reflect` 生成跨主题综合文章（需先通过 lint）
6. **查看** — 在 Obsidian 中打开 `wiki/` 目录，浏览 `[[wikilinks]]`

## 命令

### 核心 KB 流水线

| 命令 | 说明 |
|---|---|
| `/kb-sync` | Zotero → `raw/zotero/papers/`（在线 API 或离线 JSON 导入） |
| `/kb-ingest` | 暂存 URL、笔记、文档 → `raw/` |
| `/kb-compile` | `raw/` → `wiki/sources/` + `wiki/concepts/` + `index.md` |
| `/kb-lint` | 健康检查：溯源、wikilinks、重复、孤立页面 |
| `/kb-ask` | 带引用的 wiki 查询 → `outputs/queries/` |
| `/kb-reflect` | 跨主题综合 → `wiki/synthesis/`（需 lint 通过） |

### 研究与审查

| 命令 | 说明 |
|---|---|
| `/research-lit` | 跨本地内容和外部来源的文献检索 |
| `/research-review` | 架构和 wiki 质量的外部深度审查 |
| `/gpt-nightmare-review` | 通过 Codex CLI 的对抗性仓库审查 |
| `/meta-optimize` | 分析使用日志并提出工作流改进建议 |
| `/mermaid-diagram` | 生成架构和流水线图表 |

## Zotero 集成

两条独立的同步路径，拥有不同的故障域：

| 路径 | 使用场景 | 方式 |
|---|---|---|
| **在线** | Zotero 运行中 | pyzotero 本地 API（端口 23119） |
| **离线** | Zotero 已关闭 | 导入 Better BibTeX JSON 导出文件 |

支持集合级同步（`--collection "名称"`）、WSL2 连接自动检测、基于 manifest 的增量同步。

## 目录结构

```
llm-wiki/
├── CLAUDE.md              # Schema：LLM 行为规则 + 溯源模型
├── ARCHITECTURE.md        # 详细架构文档
├── raw/                   # 原始数据源（用户所有，LLM 只读）
│   ├── zotero/papers/     # 从 Zotero 自动同步
│   ├── web/               # URL → markdown 快照
│   ├── notes/             # 自由笔记
│   └── documents/         # PDF、图片等
├── wiki/                  # 知识 wiki（LLM 维护）
│   ├── index.md           # 主索引
│   ├── sources/           # 每个原始数据源一个摘要
│   ├── concepts/          # 主题文章，带 [[wikilinks]]
│   ├── synthesis/         # 跨主题综合
│   └── archive/           # 已归档文章
├── outputs/               # 生成的制品（不回流到 wiki）
│   ├── queries/           # Q&A 历史
│   └── reviews/           # 文献综述
├── tools/                 # Python & JS 工具
│   ├── zotero_sync.py     # Zotero 同步（双路径）
│   └── requirements.txt   # Python 依赖
├── log.md                 # 追加式操作日志
└── .kb/                   # 内部状态（manifest、同步追踪）
```

## 技术栈

| 组件 | 技术 |
|---|---|
| Wiki 维护 | Claude Code（slash commands + CLAUDE.md schema） |
| Zotero 访问 | pyzotero（在线）/ JSON 导入（离线） |
| 知识查看 | Obsidian |
| 版本控制 | Git |
| 审查工具 | ARIS 风格 hooks（Codex CLI, meta-optimization） |

## 设计原则

1. **用户拥有 raw/，LLM 维护 wiki/** — 清晰的所有权边界
2. **全面溯源** — 每条论断都有标记，query-derived 永远不进入 wiki
3. **先 lint 后 reflect** — 确定性检查先于 LLM 综合
4. **少目录、富元数据** — 实体类型作为标签，不做过早的分类体系
5. **增量且幂等** — 重复运行是安全的，只处理新内容
6. **Git 备份** — 所有 wiki 变更有意义的提交追踪
7. **冲突显式暴露** — 矛盾被标记而非隐藏

## 致谢

本项目的灵感和工具链来自：

- **[Andrej Karpathy 的 llm-wiki 概念](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** — 使用 LLM 构建和维护个人知识 wiki 的原始创意。
- **[llm-knowledge-base](https://github.com/louiswang524/llm-knowledge-base)** by Louis Wang — 基于 Claude Code 构建的自管理个人知识库，验证了这一方案的可行性。
- **[ARIS (Auto-claude-code-research-in-sleep)](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep)** — 用于自主 ML 研究工作流的 Claude Code 自定义 skills。本仓库中的 `/research-review`、`/gpt-nightmare-review`、`/meta-optimize` 及 agent-deck 集成均改编自 ARIS。

## 许可证

MIT
