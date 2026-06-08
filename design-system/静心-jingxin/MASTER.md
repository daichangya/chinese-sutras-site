# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** 静心 jingxin  
**Generated:** 2026-06-05  
**Category:** Buddhist reading / classical Chinese portal  
**Author:** jingxin

---

## Global Rules

### Color Palette

| Role | Light | Dark | CSS Variable |
|------|-------|------|--------------|
| Paper | `#f8f5ef` | `#0c0a09` | `--jx-paper` / `--background` |
| Paper Elevated | `#fffefb` | `#1c1917` | `--jx-paper-elevated` / `--card` |
| Paper Deep | `#f0ebe2` | `#141210` | `--jx-paper-deep` |
| Ink | `#1c1917` | `#fafaf9` | `--foreground` |
| Ink Classical | `#2b2318` | `#f5f0e8` | `--jx-ink-classical` |
| Muted | `#78716c` | `#a8a29e` | `--muted` |
| Muted Label | `#9a8e7a` | `#78716c` | `--jx-muted-label` |
| Cinnabar (Primary) | `#8b2500` | `#c44a2a` | `--jx-accent-cinnabar` / `--accent` |
| Cinnabar Hover | `#6f1d00` | `#a83210` | `--jx-accent-cinnabar-hover` |
| Gold | `#b08d57` | `#d4a96a` | `--jx-gold` |
| Border | `#d9d0c1` | `#292524` | `--border` / `--jx-border` |
| Card BG | `rgba(255,255,255,0.6)` | `rgba(28,25,23,0.6)` | `--jx-card-bg` |
| Error | `#991b1b` | `#fca5a5` | `--jx-error` |
| Error BG | `#fef2f2` | `#450a0a` | `--jx-error-bg` |
| Success | `#166534` | `#86efac` | `--jx-success` |

**Tailwind:** use `text-jx-gold`, `bg-jx-paper`, etc. from `@theme`.  
**CSS:** use `var(--jx-gold)`, `var(--jx-paper)`, etc.

**Color Notes:** 宣纸暖白 + 朱砂强调 + 金饰点缀。禁止 `amber-*` Tailwind 类。

### Typography

| Role | Font Stack | Usage |
|------|-----------|-------|
| UI / Shell | `--jx-ui-font` (Noto Sans SC) | 导航、按钮、发现层标题 |
| Reading | `--jx-reading-font` (Noto Serif SC) | `prose-jx` 经页正文 |
| Display | `--jx-display-font` (Ma Shan Zheng) | 首页「静心」标题 only |

body 默认 sans（壳层）；阅读区显式 serif。

### Layout Grid

| Token / Class | Width | Usage |
|---------------|-------|-------|
| `--jx-header-height` | 52px | 顶栏高度 |
| `.jx-shell` | 80rem (1280px) | Header / Footer |
| `.jx-page` | 75rem (1200px) | 发现层页面 |
| `.jx-hero-content` | 75rem (1200px) | 首页 Hero 内容 |
| `.jx-combo-search` | 48.75rem (780px) | 组合搜索条 |
| `.jx-reader` | 80rem (1280px) | 阅读器外壳 |
| `--jx-measure` | 38rem | 正文行宽 |
| `--jx-sidebar-width` | 17.5rem | TOC / AI 侧栏 |

### Spacing

| Token | Value |
|-------|-------|
| `--spacing-jx-section` | 3.5rem |
| `--spacing-jx-page` | 1rem |
| `--jx-section-gap` | 3.5rem |

### Shadow Depths

| Level | Variable | Usage |
|-------|----------|-------|
| sm | `--shadow-jx-sm` | Subtle lift |
| default | `--jx-card-shadow` | Cards |
| hover | `--jx-card-shadow-hover` | Card hover (no translateY) |
| hero | `--shadow-jx-hero` | Combo search |

---

## Layout Variants

| Variant | Container | Header | Pages |
|---------|-----------|--------|-------|
| Portal | `.jx-portal-hero.jx-full` | transparent + blur | `/` |
| Discovery | `.jx-page` | border + frosted | 搜索/辞典/经藏/图谱/地理/收藏/关于 |
| Reader | `.jx-reader` | minimal chrome | `/sutra/*`, 对读, 字帖 |
| Immersive | full viewport minus header | embedded sub-nav | `/chat` |

---

## Component Specs

### Buttons

- Primary: `--jx-accent-cinnabar` bg, white text, hover `--jx-accent-cinnabar-hover`
- Outline: transparent + `--border`
- Ghost: hover `--jx-paper-deep`
- Transition: 200ms, no layout shift on hover

### Cards

- `.jx-sutra-card` — solid paper elevated, border, shadow hover (no translateY)
- `.jx-glass-card` — semi-transparent + backdrop blur
- `.jx-list-card` — list item container

### Chips

- `.jx-chip` / `.jx-chip--active` — pill filters, cinnabar active state
- Sizes: `sm` (0.75rem pad), `md` (default)

### Inputs

- `.jx-input` — rounded-lg, `--jx-paper-elevated` bg, cinnabar focus ring
- `.jx-combo-search` — hero search bar with cinnabar button

### Dialog

- Overlay: `bg-black/50` + optional blur
- Content: `--jx-paper-elevated` bg, `--jx-border`, rounded-xl
- Drawer variant: slide from right (mobile nav)

---

## Motion

- Transitions: 150–300ms ease
- Page enter: `.animate-jx-fade` (opacity + subtle translateY on mount only)
- **Forbidden:** hover `translateY` / `scale` that shifts layout
- `@media (prefers-reduced-motion: reduce)` — disable animations

---

## Accessibility (ui-ux-pro-max)

- Skip link to `#main-content` (required)
- Sticky header: `scroll-margin-top: var(--jx-header-height)` on anchored content
- Focus visible: 2px cinnabar outline
- All clickable elements: `cursor-pointer`
- Heading hierarchy: h1 once per page, sequential h2/h3
- Responsive: 375 / 768 / 1024 / 1440px, no horizontal scroll

---

## Anti-Patterns (Do NOT Use)

- ❌ Emojis as icons — use Lucide SVG
- ❌ `amber-*` Tailwind classes
- ❌ `red-*` for errors — use `--jx-error-*`
- ❌ Sans-serif in reader body (`prose-jx`)
- ❌ Layout-shifting hover (translateY/scale on cards)
- ❌ Instant state changes — always transition 150–300ms
- ❌ Invisible focus states

---

## Pre-Delivery Checklist

- [ ] No emojis as icons
- [ ] All icons from Lucide, consistent 24×24
- [ ] `cursor-pointer` on clickable elements
- [ ] Hover: shadow/border only, no layout shift
- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Dark mode paper-elevated readable
- [ ] Focus states visible
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 375/768/1024/1440px
- [ ] No content hidden behind sticky header
