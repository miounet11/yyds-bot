# yyds-bot 1.0.0

一份简报、一条命令、一个做完的静态网站。人、Google、Bing、百度，以及回答引擎，读到的是同一组事实：HTML、JSON-LD、`llms.txt`，以及 Markdown 镜像。代理不会停下来提问。

需要 Node.js 22 或更新版本。

## 快速开始

```bash
git clone https://github.com/miounet11/yyds-bot
cd yyds-bot
npm install
node dist/cli.js --version
node dist/cli.js run --brief examples/minimal.yaml --fresh
```

`npm install` 会编译 `dist/`（`prepare` 脚本）。`examples/minimal.yaml` 只有：

```yaml
industry: specialty-coffee
domain: harbor-kiln.example
```

进程退出码为 0，且输出里有 `pillar=seo_geo score=100`、`pillar=ui score=100`、`pillar=ai score=100` 和 `audit EXIT=0`，才算做完。站点在 `.yyds/harbor-kiln/site`。再用 `node dist/cli.js audit --brief examples/minimal.yaml` 可以重打分数。

`--until <阶段>` 只用于调试，提前停下不算做完。阶段顺序：`expand`、`intent`、`infra`、`build`、`audit`、`deploy`、`index`、`observe`、`autopilot`。

## 三个支柱

| 支柱 | 通过时站点里有什么 |
| --- | --- |
| SEO + GEO | 单一主域名 canonical、站点地图与可索引 HTML 双向一致、搜索与 AI 爬虫 robots 放行、带 `@id` 的 JSON-LD `@graph`、`llms.txt` / `llms-full.txt`、每个实体的 llms、`index.md` 镜像、结论先行、事实表、FAQ、引用、关于 / 作者 / 联系 / 编辑政策、IndexNow / GSC / 百度计划 |
| UI | 具名主题令牌、WCAG AA 对比度、18px 正文、44px 点击目标、可见焦点、减少动效、手机底栏、体积预算 |
| AI 可用性 | 代理按 `AGENTS.md` 执行 `yyds run`。消费方读取 `/openapi.json`、`/mcp.json` 和 `/api/offers.json`（价格与专业点）。失败时 `reports/audit.json` 给出检查编号 |

`yyds audit` 只是把分数再打印一次。`yyds run` 已经用它当门槛，检查失败会重建站点，最多三次。检查编号见 [docs/pillars.md](docs/pillars.md)。

页面是静态 HTML。爬虫不必执行前端包，这次本地演练也不需要服务器。Nginx、证书和每日定时任务会写成脚本，等你把域名指到这些文件上再执行。

## 在下游项目里引用

**交给 AI 的一段话**（原样复制）：

```text
You are building a production website with the yyds-bot repository. Do not ask me questions. Read AGENTS.md. Run `npx yyds run --brief brief.yaml` (or `node dist/cli.js run --brief brief.yaml --fresh` inside a clone). If brief.yaml only has industry and domain, that is enough. The command must exit 0 and every pillar score must be 100. Do not commit secrets. If it fails, read .yyds/<project>/reports/audit.json and run the command again.
```

**从 GitHub 安装**（`prepare` 会生成 `dist/`）：

```bash
npm install github:miounet11/yyds-bot
npx yyds run --brief brief.yaml
```

**子模块或克隆**

```bash
git submodule add https://github.com/miounet11/yyds-bot vendor/yyds-bot
npm install --prefix vendor/yyds-bot
node vendor/yyds-bot/dist/cli.js run --brief brief.yaml --fresh
```

简报里唯一不能编造的字段是 `domain`。没有 `industry` 时记成 `general`，并写进 `.yyds/<id>/reports/expansion.json`。已经带 `version: "1"` 和 `entities` 的完整简报会严格校验，缺字段就失败，不会悄悄补上。

## 凭证

**本地跑通所必需的：** Node.js 22+，以及简报里的主机名。不需要 API 密钥。

**可选。** 默认展开的简报不会调用下面这些服务。只有你明确打开时才会读。

| 变量 | 什么时候会读 |
| --- | --- |
| `OPENAI_BASE_URL`、`OPENAI_API_KEY` | 展开阶段，两个都有值时。可以改写标语和首页导语。正文仍来自数据。未设置 `OPENAI_MODEL` 时用编码默认值 `gpt-4o-mini`。调用失败或文本太短则保留预设。 |
| `INDEXNOW_KEY`、`GSC_ACCESS_TOKEN`、`BAIDU_PUSH_TOKEN` | 仅当完整简报把 `index.live_submit` 设为 true，且站点不是未复核的 YMYL。否则只写 `reports/index-plan.json`，不发请求。 |
| `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ZONE_ID` | 仅当 `mode` 为 `production` 且 `cloudflare.enabled` 为 true。本地模式只写 `infra/dns-plan.json`。 |
| `GSC_ACCESS_TOKEN` | 完整简报把 `observe.mode` 设为 `live` 时也用它。默认是 `fixture`（一份合成的 Search Console 文件）。 |
| `YYDS_BOOTSTRAP_EXECUTE=1` | 执行生成的 `infra/bootstrap.sh`（nginx、certbot、systemd）。不设置时脚本退出码为 2，不改机器。主机名以 `.example`、`.invalid`、`.test`、`.localhost` 结尾时跳过 certbot。 |
| `YYDS_BIN` | 服务器上 `yyds` 可执行文件的绝对路径，给定时任务脚本用。 |

非公开联系字段可以写环境变量名（法律预设用 `SITE_PHONE`）。这个值不会出现在 HTML、JSON-LD、llms 或 OpenAPI 里。

## 命令

| 命令 | 作用 |
| --- | --- |
| `yyds --version` | 打印 `1.0.0`。 |
| `yyds run --brief brief.yaml` | 全部阶段。简报文件未变时从已完成阶段继续。 |
| `yyds run --brief brief.yaml --fresh` | 重跑。只能追加的发布日志会保留。 |
| `yyds autopilot --brief brief.yaml` | 按测量缺口补上待写页面，并重新打分。 |
| `yyds audit --brief brief.yaml` | 对已有结果打印三个支柱分数。 |
| `yyds rollback --brief brief.yaml --stage build` | 恢复该阶段开始前的快照。 |

## 已知限制

- 不会发起 SSH。这一版的发布是 `.yyds/<id>/deploy` 下的原子符号链接。交给主机的是 `infra/bootstrap.sh` 和 `infra/nginx.conf`。
- 结账是静态状态机（`?checkout_sku=` 与 `?ai_ref=`）。不扣款，也不把电话写到服务器。
- `mcp.json` 是工具说明，不是正在运行的 MCP 服务。不生成微信小程序。
- OG 图是品牌色块。本地化标题在 `og:title`。
- 未识别的行业使用带标注的占位预设（来源 URL 在 `example.com`）。咖啡、法律、健康、金融有专门预设。
- YMYL 页面（法律、健康、金融）可以抓取，并带 `data-ymyl="unreviewed"`。在完整简报把 `human_review_approved` 设为 true 之前，不主动推送索引。程序不会为此向人提问。
- 必须通过的性能门槛是体积预算。`.lighthouserc.cjs` 可选，且需要本机有 Chrome。
- 默认语言是 `/` 英文和 `/zh` 中文。第三种语言需要完整简报和对应界面文案。
- 编写 1.0.0 时读不到 `miounet11/yyds` 与 `miounet11/yyds-2`，因此阶段设计遵循这两份仓库的书面说明，而不是逐行拷贝。

英文说明见 [README.md](README.md)。验收日志见 [INSTRUCTIONS.md](INSTRUCTIONS.md)。版本说明见 [CHANGELOG.md](CHANGELOG.md)。
