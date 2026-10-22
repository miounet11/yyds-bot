# yyds-bot

一份简报、一条命令、一个做完的静态网站。人、Google、Bing、百度，以及回答引擎，读到的是同一组事实：HTML、JSON-LD、`llms.txt`，以及 Markdown 镜像。代理不会停下来提问。

```bash
npm install
npm run build
node dist/cli.js run --brief examples/minimal.yaml --fresh
```

`examples/minimal.yaml` 只有：

```yaml
industry: specialty-coffee
domain: harbor-kiln.example
```

SEO/GEO、UI、AI 三个支柱分数都是 100 时，进程退出码为 0。

## 为什么用静态 HTML

站点是生成出来的文件。爬虫和模型不必执行前端包就能读到正文，本地演练也不需要服务器。Nginx、证书和每日定时任务会写成脚本，等你把域名指到这些文件上再执行。不必上 Next.js SSR。多租户时，每个租户一份简报，由 Nginx 按 Host 分发。

## 三个支柱

| 支柱 | 完成标准 |
| --- | --- |
| SEO + GEO | 主域名 canonical、站点地图与 HTML 双向一致、robots 放行名单、JSON-LD `@graph`、`llms.txt` / `llms-full.txt`、每个实体的 llms、`.md` 镜像、结论先行、引用、E-E-A-T 页面、IndexNow / GSC / 百度计划 |
| UI | 设计令牌、WCAG AA 对比度、18px 正文、44px 点击目标、焦点、减少动效、手机底栏、体积预算 |
| AI 可用性 | 代理按 `AGENTS.md` 执行 `yyds run`。消费方读取 OpenAPI、MCP 和商品 JSON。失败时给出检查编号。 |

`yyds audit` 只是把这些分数再打印一次。流水线内部已经用它当门槛，失败会重建站点再测。

## 在你的项目里使用

把下面这段话原样交给代理：

```text
你正在用 yyds-bot 仓库做正式网站。不要向我提问。先读 AGENTS.md。执行 `npx yyds run --brief brief.yaml`（如果是克隆本仓库，则在 npm run build 之后执行 `node dist/cli.js run --brief brief.yaml --fresh`）。brief.yaml 只有 industry 和 domain 就够了。命令必须退出码为 0，三个支柱分数都必须是 100。不要提交密钥。如果失败，阅读 .yyds/<project>/reports/audit.json 后再执行一次。
```

依赖方式：

```bash
npm install github:miounet11/yyds-bot
npx yyds run --brief brief.yaml
```

或：

```bash
git submodule add https://github.com/miounet11/yyds-bot vendor/yyds-bot
npm install --prefix vendor/yyds-bot
npm run build --prefix vendor/yyds-bot
node vendor/yyds-bot/dist/cli.js run --brief brief.yaml --fresh
```

密钥只放在环境变量里，名字见 `.env.example`。简报里只写变量名。

## 展开时会补上什么

默认语言是 `/` 英文和 `/zh` 中文，并按行业选择主题、实体×属性页、商品、关于 / 作者 / 联系 / 编辑政策，以及本地服务器计划（`203.0.113.10`，不发起 SSH）。每一项写在 `.yyds/<id>/reports/expansion.json`。已经带 `version: "1"` 和 `entities` 的完整简报会严格校验，缺字段就失败，不会悄悄补上。

若设置了 `OPENAI_BASE_URL` 和 `OPENAI_API_KEY`，展开阶段可以改写标语和首页导语。正文仍然来自数据，不靠模型现写文章。模型失败或太短时保留预设。

行业预设：咖啡、法律服务（YMYL、演示证件号、电话仅在询问后提供）、健康、金融，其余用带标注的占位预设。YMYL 页面可以抓取，并标明未经人工复核。在完整简报把 `human_review_approved` 设为 true 之前，不会主动推送索引。程序不会为此向人提问。

## 命令

| 命令 | 作用 |
| --- | --- |
| `yyds run --brief brief.yaml` | 全流程。简报文件未变时从已完成阶段继续。 |
| `yyds run --brief brief.yaml --fresh` | 重跑，保留只能追加的发布日志。 |
| `yyds autopilot --brief brief.yaml` | 按测量缺口补上待写页面，并重新打分。 |
| `yyds audit --brief brief.yaml` | 打印三个支柱分数。 |
| `yyds rollback --brief brief.yaml --stage build` | 恢复该阶段之前的快照。 |

## 凭证与限制

DNS、IndexNow、Google Search Console、百度，以及 Search Console 回拉，只有在对应环境变量存在时才发请求。否则只写计划，命令仍然可以退出码 0。`bootstrap.sh` 仅在 `YYDS_BOOTSTRAP_EXECUTE=1` 时改机器。`.example` 域名跳过 certbot。结账是静态状态机，不扣款、不把电话写到服务器。装有 Chrome 时可以另跑 `.lighthouserc.cjs`；必须通过的性能门槛是审计里的体积预算。

本环境访问 `miounet11/yyds` 与 `miounet11/yyds-2` 返回 404，因此阶段设计遵循这两份仓库的书面说明（简报、质量门、原子改名发布、IndexNow、systemd、站点地图校验），而不是逐行拷贝。

英文说明见 [README.md](README.md)。逐步验收见 [INSTRUCTIONS.md](INSTRUCTIONS.md)。建议文档对照见 [docs/advice-map.md](docs/advice-map.md)。
