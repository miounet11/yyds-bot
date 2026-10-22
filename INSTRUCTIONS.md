# INSTRUCTIONS

Acceptance is a command whose exit code is 0. Do not prompt a person between steps.

## 0. Install

```bash
npm install
npm run build
```

## 1. One command (definition of done)

```bash
node dist/cli.js run --brief examples/minimal.yaml --fresh
```

Expect stdout to include:

```text
stage=expand EXIT=0
stage=intent EXIT=0
stage=infra EXIT=0
stage=build EXIT=0
pillar=seo_geo score=100 threshold=100 EXIT=0
pillar=ui score=100 threshold=100 EXIT=0
pillar=ai score=100 threshold=100 EXIT=0
audit EXIT=0
stage=audit EXIT=0
stage=deploy EXIT=0
stage=index EXIT=0
stage=observe EXIT=0
stage=autopilot EXIT=0
```

Exit code of the process: 0.

## 2. Reprint the gate

```bash
node dist/cli.js audit --brief examples/minimal.yaml
```

Exit code: 0.

## 3. Post-launch loop

```bash
node dist/cli.js autopilot --brief examples/minimal.yaml
```

The first autopilot run adds the backlog page that the synthetic Search Console gap points at. A second run adds nothing and still exits 0. The generated systemd timer is `.yyds/harbor-kiln/infra/yyds-autopilot.timer`.

## 4. Bootstrap syntax

```bash
bash -n .yyds/harbor-kiln/infra/bootstrap.sh
```

Exit code: 0. The script does not change a machine unless `YYDS_BOOTSTRAP_EXECUTE=1`.

## 5. Tests

```bash
npm test
```

Exit code: 0.

## What the agent must not do

- Do not ask which pages to write. Expansion writes them.
- Do not ask for an API key. Missing keys stay in the index plan as `submitted: false`.
- Do not treat `yyds audit` as the product. The product is a finished site.
