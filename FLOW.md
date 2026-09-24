# Wondeya Beaut Spa (WBS) — UI Flow & Design Documentation

> **Purpose:** Complete UI map of the salon POS + admin system, written for translating into **Figma**.
> **App type:** React SPA (PWA) · **Roles:** Admin, Cashier · **Locale:** English / Amharic · **Currency:** ETB (Birr)

---

## 1. Design System (Figma Variables)

Create these as Figma color styles / variables first — every screen uses them.

### Colors

| Token | Hex | Use |
|---|---|---|
| `bg-body` | `#F8F9FC` | Page background |
| `bg-card` | `#FFFFFF` | Cards, panels, modals |
| `text-primary` | `#1F2937` | Headings, body text |
| `text-secondary` | `#6B7280` | Subtitles, labels |
| `text-muted` | `#9CA3AF` | Placeholders, disabled |
| `primary` | `#EC4899` | Brand pink — buttons, active tabs, accents |
| `primary-light` | `#FBCFE8` | Selected rows, badges, light fills |
| `success` | `#10B981` | Online, active, success |
| `danger` | `#EF4444` | Delete, logout, errors |
| `warning` | `#F59E0B` | Offline, pending |
| `border` | `#E5E7EB` | Dividers, input borders |

### Typography

- **Font:** Inter (400 / 500 / 600 / 700 / 800)
- **Scale suggestion:** 12 (caption) · 14 (body) · 16 (subtitle) · 18–20 (section title) · 24–28 (page title) · 32 (stat numbers)

### Base styles

- **Card:** white, `18px` radius, soft shadow, padding 16–24px
- **Buttons:** pill/rounded, `primary` fill for main CTA, outline/ghost for secondary, `danger` for destructive
- **Inputs/selects:** white, `1px` `border` color, pink focus ring
- **Icons:** emoji/unicode only (⚠️ ☀️ ✅ ▼ ▶ ☰ ✕ + 💳 📊 💇 👥) — no icon library
- **Avatars:** circle with initial letter of staff name
- **Responsive breakpoint:** 768px (mobile swaps layouts)

### Chart palette (Recharts)

`#8884d8` `#82ca9d` `#ffc658` `#ff7c7c` `#a4de6c` `#d0ed57` `#8dd1e1` `#83a6ed` `#8e4585` `#ffb6c1`

---

## 2. Screen Inventory

| # | Screen | Route | File |
|---|---|---|---|
| 1 | Login | `/` | `pages/Login.jsx` |
| 2 | Cashier POS | `/cashier` | `pages/CashireDashboard.jsx` |
| 2a | — Start Day gate | (state) | same file |
| 2b | — Pending Closure gate | (state) | same file |
| 2c | — End Day modal | (overlay) | same file |
| 3 | Admin Shell | `/admin` | `pages/AdminDashboard.jsx` |
| 3a | Dashboard (analytics) | tab `dashboard` | `admin/DashboardView.jsx` |
| 3b | Services | tab `services` | `admin/ServicesView.jsx` |
| 3c | Categories | (below services) | `admin/CategoriesView.jsx` |
| 3d | Staff | tab `staff` | `admin/StaffView.jsx` |
| 3e | Transactions | tab `transactions` | `admin/TransactionsView.jsx` |
| 3f | Reports | tab `reports` | `admin/ReportsView.jsx` |
| 3g | Cashier Panel (live) | tab `cashierpanel` | `admin/AdminCashierView.jsx` |
| 3h | Settings | tab `settings` | `admin/SettingsView.jsx` |

> Build **one frame per screen/state** in Figma. Admin tabs are views inside a shared shell — use a single shell frame + swap the content area.

---

## 3. Global Components (build once, reuse everywhere)

### 3.1 Top Header Bar (both dashboards)
- Left: brand "WBS" / "Wondeya Beaut Spa"
- Center/right: nav tabs (admin) · date + transaction count (cashier)
- Right: **Language toggle (EN ⇄ አማ)**, **Online/Offline pill**, action buttons (End Day / Logout)

### 3.2 Offline Indicator Pill
- **Online:** green `#10B981` · white dot · label "ONLINE"
- **Offline:** amber `#F59E0B` · label "OFFLINE"
- Optional trailing badge: `N pending` (amber count)

### 3.3 Toast (top-right stack)
- Slides in from right, auto-dismiss ~3.5s
- Variants: ✅ success (green), ❌ error (red), ℹ️ info (gray)

### 3.4 Modal pattern
- Dark semi-transparent overlay, centered white card (18px radius)
- Title, body content, footer buttons: primary CTA + Cancel
- Close via ✕ or overlay click (staff modal) / explicit Cancel

### 3.5 Sidebar (Admin, desktop ≥768px)
- Left column, vertical buttons with icons + labels
- Active item highlighted in `primary-light` / `primary`

### 3.6 Sidebar Drawer (Admin, mobile <768px)
- Hamburger ☰ in header → slides-in panel from left + dark overlay → tap item → closes

### 3.7 Buttons library
| Variant | Style |
|---|---|
| Primary | `#EC4899` fill, white text |
| Secondary | white fill, pink border/text |
| Danger | `#EF4444` fill, white text |
| Ghost | transparent, gray text |
| Disabled | muted fill, `text-muted` |

### 3.8 Empty / Loading / Error patterns
- **Loading:** button spinner text ("Signing in…", "Syncing…") or "Loading …" placeholder
- **Empty:** centered gray message ("No services available.", "No staff yet", "No transactions found")
- **Error:** red inline banner or red toast; login shows error box above button
- **Offline banner:** amber pending-count banner (admin), blocked actions with "sync first" toast

---

## 4. Screen-by-Screen Breakdown

### Screen 1 — Login (`/`)

**Layout:** Full-screen `bg-body`, single centered card (~400px wide).

**Elements top → bottom:**
1. Logo block — "WBS" wordmark (pink)
2. Heading: phone number label + input (placeholder: phone)
3. Password label + input
4. Language toggle button (top-right of card or corner)
5. Error box (conditional, red tinted)
6. **Primary button:** "Sign in" (loading state: "Signing in…")
7. Footer: "Wondeya Beaut Spa v1.0"

**Flow:**
```
[Empty] → fill phone + password → Sign in
  ├─ success + role=admin  → Admin Dashboard
  ├─ success + role=cashier → Cashier POS
  └─ fail → error box, stay on page
Already has session? → auto-redirect to role's dashboard
```

**States to design:** default · focused inputs · loading · error · (optional) offline fallback login.

---

### Screen 2 — Cashier POS (`/cashier`)

Single-screen app with **gates** before the main UI.

#### 2a — Start Day gate
Full-screen centered card:
- ☀️ / welcome icon
- "Start Day" heading + short description
- **Primary button: Start Day**

#### 2b — Pending Closure gate (previous day not closed)
Full-screen warning card:
- ⚠️ amber banner: "Previous day not closed"
- Day summary preview (date, totals)
- **Review & Close** (primary) → opens End Day modal
- **Close Automatically** (secondary/danger)

#### 2c — Main POS layout (Desktop ≥768px)

**Header bar:**
`Title · date · N transactions · [ONLINE/OFFLINE pill] · [EN⇄አማ] · End Day · Logout`

**Split body:**

| Left 60% — Service Catalog | Right 40% — Cart & Payment |
|---|---|
| Search/filter (if present) | Cart item list (service, staff, price, ✕ remove) |
| Services grouped by **category** (section headers) | **Payment method select:** Cash / Telebirr / Abysinya / CBE |
| Each row: `[checkbox] Service name — price` + **staff dropdown** | **Tips per staff:** staff select + amount + ✕ rows, "+ tip" |
| **Add Selected Services (N)** primary button | **Complete Transaction** (primary) |
| **Hide Services** toggle | **Clear Cart** (ghost/danger) |
| | **Session summary:** totals per payment type + tips by staff |
| | **Offline history** collapsible panel (pending count, Sync All) |

**Mobile <768px:** single scrollable column; floating **"Show Services"** toggle swaps between catalog panel and cart panel.

#### 2d — End Day modal
Overlay modal containing:
- Date, transaction count
- Total income · Expenses
- Payment split: Cash / Telebirr / Abysinya / CBE
- **Asrat money** (business rule: 10% of (income − nonAsrat sales − 5500) if > 5500)
- Tips
- **Final cash on hand**
- Input: **Closing balance**
- Buttons: **Confirm & End Day** (primary) · Cancel

> ⚠️ End Day is **blocked** if offline transactions are pending → toast "Sync first".

**Cashier flow:**
```
Login → Start Day (or Pending Closure gate)
  → POS main
     → check services + staff → Add Selected
     → pick payment method → (optional tips)
     → Complete Transaction → toast + session totals update
     → repeat
     → [offline? transactions queue in IndexedDB → Sync All when online]
  → End Day → modal → enter closing balance → Confirm → back to Start Day gate
  → Logout → Login
```

**States:** no items in cart · empty session · offline pending · syncing · blocked end-day.

---

### Screen 3 — Admin Shell (`/admin`)

**Layout (desktop):**
```
┌──────────────────────────────────────────────┐
│ HEADER: brand · top tabs · lang · logout     │
├────────────┬─────────────────────────────────┤
│ SIDEBAR    │  CONTENT AREA                   │
│ (nav)      │  (swaps per active tab)         │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

**Sidebar / top tabs:** Dashboard · Services · Staff · Transactions · Reports · Cashier Panel · Settings

**Mobile:** hamburger → drawer sidebar + overlay; header keeps brand + ☰ + lang + logout.

**Navigation note:** tabs are **state-based** (URL stays `/admin`). Design as one shell + 7 content variants.

---

#### 3a — Dashboard (Analytics)

**Row 1 — 6 stat cards (2 rows × 3 or 1 × 6):**
| Card | Content |
|---|---|
| Today services / Today revenue | count + Birr |
| Week services / Week revenue | count + Birr |
| Month services / Month revenue | count + Birr |

**Charts section:**
1. **Service Activity Trend** — line chart + tabs: Daily / Weekly / Monthly
2. **Category Distribution** — donut · click slice → drill into per-service counts
3. **Top 10 Services** — horizontal/vertical bar · click bar → today/week/month drill-down
4. **Revenue Distribution** — donut · drill-down today/week/month
5. **Monthly Growth** — area chart · click point → month detail popup
6. **Key Insights grid** — 6 small cards: Most Popular Service · Highest Revenue · Fastest Category · Busiest Day · Peak Hours · Growth %

**States:** no data on charts · loading.

---

#### 3b — Services + Categories

**Services section:**
- Inline add/edit form: `Name` · `Category select` · `Price` · `nonAsrat` checkbox · Submit / Cancel
- Numbered list of services (flat) · **Show All / Hide All** toggle
- Per-row actions: edit (inline) · delete (native confirm) · move (modal)

**Categories section (below):**
- Add category input + Save
- Expandable category cards ▼/▶
  - Rename / Delete category
  - Sub-categories list: inline rename · delete · **Move** (modal: target category select + Cancel)
  - Services under each: inline edit · delete · **Move** (modal)

**Modals:** Move Subcategory · Move Service (both: overlay + select target + Cancel).

---

#### 3c — Staff

- **Add/Edit form:** Name · Role select (`Hairdresser / Cashier / Nail Tech / Massage / Makeup / Other`) · Phone · Account no · Salary · Password (only visible when Role = Cashier)
- **Grid of staff cards:** circle avatar (initial) · name · role · "# services · # days" stats · Active/Inactive badge (green/gray)
- **Click card → Detail modal:** avatar, name/role, phone, account, salary, joined date, activity stats · buttons: **Edit · Delete · Close**

**States:** no staff yet · form validation.

---

#### 3d — Transactions (search & filter)

- **Filter bar:** From date · To date · Staff · Category · Service · Payment method · Free-text search
- **Buttons:** Search (primary) · Show All · Hide Results
- **Filtered Totals panel:** Cash · Telebirr · Abysinya · CBE · Asrat · **Total**
- **Table:** transaction rows (services with row-span), payment method badges, tip column, grand-total footer row
- **States:** no results · loading · pagination (if any).

---

#### 3e — Reports (daily)

- Date range From/To (defaults today)
- Collapsible accordion sections ▼/▶:
  1. **Report — [range]:** total income · cash total · transfer total · tips · tx count · service count · Asrat money · final cash on hand
  2. **Payment Breakdown:** Cash / Telebirr / Abysinya / CBE bars or rows
  3. **Transactions:** table
- **States:** "No transactions for this date" · loading.

---

#### 3f — Cashier Panel (live monitor)

- **Status banner:** Open/Closed day · today's date · tx & service count · total income · expenses
- **Live Cart** (mirrors cashier's current cart, from Redux)
- **Session Summary:** cash · transfer · expenses · tips · grand total
- **Tips by Staff** list
- **Expenses** list
- **Services used today** — chip/tag cloud
- **Today's Transactions** — full list
- Polls every 15s → design a subtle "auto-refreshing" indicator.
- **States:** day closed · loading.

---

#### 3g — Settings

- **Account section:** update phone form · change password form (current + new)
- **Danger Zone** (red-bordered card):
  - **Clear all local data** → native confirm
  - **Delete Transactions:** datetime range select → Search → checkbox list (Select All) → confirm password → **Delete**

**States:** updating… · searching… · deleting… · error banners.

---

## 5. Full Navigation Flow (put this on one Figma page as a diagram)

```
                        ┌─────────────┐
                        │   LOGIN     │
                        │  (Screen 1) │
                        └──────┬──────┘
              role=cashier ─────┼────── role=admin
                    │                        │
                    ▼                        ▼
        ┌───────────────────┐    ┌────────────────────────┐
        │  CASHIER GATES    │    │   ADMIN SHELL (3)      │
        │  2a Start Day  or  │    │  sidebar/top tabs      │
        │  2b Pending Close  │    ├────────────────────────┤
        └─────────┬─────────┘    │ dashboard │ services   │
                  ▼              │ staff     │ transactions│
        ┌───────────────────┐    │ reports   │ cashierpanel│
        │  2c POS MAIN      │    │ settings  │            │
        │  catalog + cart   │    └────────────────────────┘
        └─────────┬─────────┘              │
                  │ End Day                 │ staff card click
                  ▼                         ▼
        ┌───────────────────┐    ┌────────────────┐
        │  2d END DAY MODAL │    │ STAFF DETAIL   │
        │  closing balance  │    │ MODAL          │
        └─────────┬─────────┘    └────────────────┘
                  │
                  ▼
            back to 2a (Start Day)

  Any screen ── Logout ──► LOGIN
  Any screen ── 401/expired ──► LOGIN (auto)
  Cashier ── offline ──► queue → Sync All → online
```

### Cross-screen jumps
- Staff card (admin) → can jump to **Services** view filtered for that staff's cashier
- Language toggle available on **every** screen
- Offline state visible on cashier header + admin banner

---

## 6. Modal & Overlay Checklist (design these as separate components)

| # | Modal | Used in |
|---|---|---|
| 1 | End-of-Day Summary + closing balance | Cashier |
| 2 | Staff detail | Admin → Staff |
| 3 | Move Subcategory | Admin → Categories |
| 4 | Move Service | Admin → Categories |
| 5 | Native `confirm()` dialogs (delete service/staff/category, clear cache, delete transactions) | Admin — *design a styled replacement if you want; app currently uses browser confirm* |
| 6 | Pending Closure full-screen gate | Cashier |
| 7 | Mobile sidebar drawer + dark overlay | Admin mobile |
| 8 | Toast stack (top-right) | Global |

---

## 7. UI State Matrix (design every cell)

| Screen | Default | Loading | Empty | Error | Offline |
|---|---|---|---|---|---|
| Login | ✓ | "Signing in…" | — | error box | fallback login |
| Start Day gate | ✓ | — | — | — | ✓ |
| POS catalog | ✓ | "Loading services" | "No services available." | red toast | queue + pill |
| POS cart | ✓ | — | "No items in cart" | red toast | "saved offline" toast |
| End Day modal | ✓ | — | — | blocked if pending | blocked until sync |
| Admin dashboard | ✓ | loading | "No data" on charts | toast | amber banner |
| Services list | ✓ | spinner | "No services available." | toast | cached fallback |
| Staff grid | ✓ | spinner | "No staff yet" | toast | cached fallback |
| Transactions | ✓ | loading | "No transactions found" | banner | — |
| Reports | ✓ | loading | "No transactions for this date" | banner | — |
| Cashier panel | ✓ | "Loading today's transactions" | empty lists | banner | — |
| Settings | ✓ | "Updating…/Searching…" | — | red banner | — |

---

## 8. Figma File Structure (suggested)

```
📁 Wondeya Beaut Spa — UI
├── 🎨 Foundations
│   ├── Colors (variables from §1)
│   ├── Typography (Inter scale)
│   ├── Buttons / Inputs / Badges / Cards
│   └── Icons (emoji set + avatars)
├── 🧩 Components
│   ├── Header bar (admin + cashier variants)
│   ├── Sidebar / Drawer
│   ├── Modal shell
│   ├── Toast
│   ├── Offline pill
│   ├── Stat card
│   ├── Data table row
│   ├── Accordion / collapsible
│   └── Form field (input, select, checkbox)
├── 📱 Screens
│   ├── 01 Login
│   ├── 02 Cashier — Start Day / Pending / POS (desktop) / POS (mobile) / End Day modal
│   ├── 03 Admin shell
│   ├── 03a Dashboard
│   ├── 03b Services + Categories (+ move modals)
│   ├── 03c Staff (+ detail modal)
│   ├── 03d Transactions
│   ├── 03e Reports
│   ├── 03f Cashier Panel
│   └── 03g Settings
└── 🔀 User Flows
    ├── Login → role routing
    ├── Cashier day lifecycle
    ├── Admin tab navigation
    └── Offline → sync flow
```

---

## 9. Design Notes & Gotchas

1. **Two roles = two apps visually.** Cashier is task-focused (fast POS). Admin is data-focused (nav + tables + charts). Keep them visually related via shared header/colors but different density.
2. **Bilingual:** every text string has EN + Amharic. Amharic is often wider — design with longer labels in mind (test buttons with Amharic text).
3. **Payment methods are fixed:** `Cash · Telebirr · Abysinya · CBE` — use consistent badge colors for these across POS, transactions, reports, cashier panel.
4. **Asrat** is a domain term (10% commission rule over 5500 ETB threshold) — surface it in End Day modal, Reports, and Transactions totals. Consider a small ℹ️ tooltip component.
5. **nonAsrat services** flag appears in service form and affects Asrat math — show a checkbox label with helper text.
6. **Offline-first is a core story:** design the offline pill, pending counts, "Sync All" states, and blocked-End-Day message as first-class UI.
7. **Admin tabs don't change the URL** — in Figma, prototype them as interactive component swaps inside the shell frame, not separate page navigations.
8. **Mobile breakpoint is 768px** — design at ~375px and ~1440px minimum; cashier collapses to a two-panel toggle, admin collapses sidebar to drawer.
9. **Dead code to ignore:** `Dashboard.jsx`, `TransactionPage.jsx`, `Cart`, `ServiceList`, old selector components — not part of the live UI.
10. **No real imagery** — UI uses emoji + letter avatars only; charts use the Recharts palette in §1.
