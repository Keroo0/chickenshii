# Design System: ChickenShii

## 1. Visual Theme & Atmosphere

Clean, clinical utility interface for agricultural disease detection. The mood is **trustworthy and approachable** — a veterinary tool that feels professional without being sterile. Density sits at "Daily App Balanced" (5/10) with moderate variance (4/10). Motion is restrained and purposeful — fade transitions and loading states, no decorative animation.

The atmosphere is like a **modern clinic reception**: white surfaces, clear hierarchy, warm blue accent that signals reliability. Every element earns its space through function, not decoration.

## 2. Color Palette & Roles

- **Canvas White** (#FFFFFF) — Primary background, all screen surfaces
- **Surface Mist** (#FAFAFA) — Card fills, elevated containers
- **Charcoal Gray** (#1F2937) — Primary text, headings, active states
- **Muted Slate** (#6B7280) — Secondary text, descriptions, metadata, placeholders
- **Whisper Gray** (#F3F4F6) — Input backgrounds, soft fills, inactive surfaces
- **Border Mist** (#E5E7EB) — Structural dividers, card borders, 1px lines

- **Primary Blue** (#1159B1) — CTAs, active states, links, icons, brand identity
- **Primary Light** (#3076CC) — Hover states, secondary emphasis
- **Primary Soft** (#E6F0FA) — Button backgrounds, tag fills, highlight tints

- **Signal Green** (#5FBD38) — Healthy status, success indicators
- **Signal Amber** (#FBB03B) — Warning states, disclaimers, secondary brand
- **Signal Red** (#ED1C24) — Danger, errors, critical alerts

**Disease-Specific Colors:**
- Healthy → #5FBD38 (green)
- Coccidiosis → #ED1C24 (red)
- Salmonellosis → #ED1C24 (red)
- New Castle Disease → #FBB03B (amber)

**Chart Colors (in order):** #1159B1, #5FBD38, #FBB03B, #ED1C24

## 3. Typography Rules

- **Font Family:** Outfit (Google Fonts)
  - Regular (400) — Body text, descriptions
  - Medium (500) — Labels, secondary emphasis
  - Bold (700) — Headings, buttons, emphasis
  - Black (900) — Display text, brand name

- **Type Scale:**
  - Display/Brand: `text-3xl font-black tracking-tight` — Brand name only
  - Section Heading: `text-xl font-bold` — Screen titles
  - Card Heading: `text-base font-semibold` — Card headers, chart titles
  - Body: `text-sm font-medium` — Primary content
  - Caption: `text-xs text-neutral-muted` — Metadata, helper text
  - Micro: `text-[10px]` — Fine print, disclaimers

- **Line Heights:** Relaxed for body (`leading-relaxed`), compact for UI elements
- **Tracking:** Tight on headings (`tracking-tight`), normal on body text

**Banned:** Inter, system fonts for premium contexts, generic serif fonts

## 4. Component Stylings

### Buttons
- **Primary:** `bg-primary` filled, white text, `rounded-xl` (12px), `h-12` (48px)
- **Secondary:** `border border-neutral-border`, white bg, neutral text, same sizing
- **Ghost:** Text-only with color, no background
- **Icon Button:** `h-8 w-8` circular, `bg-neutral-muted-soft`, centered icon
- **Disabled:** `opacity-60` overlay, `disabled` prop prevents interaction
- **Active State:** `activeOpacity={0.7}` on TouchableOpacity, `Pressable` for press feedback

### Cards
- **Bordered Card:** `bg-neutral-card rounded-2xl border border-neutral-border p-5`
- **Soft Card:** `bg-neutral-muted-soft rounded-3xl p-5`
- **Info Card:** Left-aligned icon + heading, description below
- **No heavy shadows** — hierarchy through borders and background tints only

### Inputs
- **Text Input:** `bg-neutral-muted-soft rounded-2xl px-5 py-4`
- **Border:** Transparent by default, `border-primary` on focus
- **Placeholder:** `text-[#9CA3AF]` — consistent gray
- **Label:** Above input, `text-sm font-bold text-neutral-foreground mb-2 ml-1`
- **Helper/Error Text:** Below input when needed

### Loading States
- **Overlay:** Modal with `bg-black/50` backdrop, centered white card
- **Spinner:** `ActivityIndicator size="large" color={colors.primary}`
- **Inline:** Same spinner for button states and list loading
- **No skeleton screens** — spinner-based loading only

### Empty States
- **Text-only:** `text-center text-neutral-muted mt-10` — minimal, no illustration

### Charts
- **Library:** `react-native-chart-kit`
- **Bar Charts:** `barPercentage: 0.6`, `borderRadius: 12`
- **Grid Lines:** `stroke: '#E5E7EB'` (border color)
- **Labels:** `text-xs text-neutral-muted`
- **Legend:** Inline colored dots with text

### Modals
- **Loading Overlay:** Transparent backdrop, centered white container with `rounded-2xl`
- **Save Worker Modal:** Bottom sheet style (not implemented as full modal)

## 5. Layout Principles

- **Safe Area:** All screens use `pt-14` for status bar clearance
- **Padding:** `px-4` (16px) for horizontal content, `px-5` (20px) for inner sections
- **Spacing:** Tailwind spacing scale — `gap-3` (12px), `gap-5` (20px), `gap-6` (24px)
- **Flex Direction:** Column-based layout, `flex-row` for horizontal alignments
- **Card Spacing:** `mb-2` (8px) to `mb-4` (16px) between stacked cards
- **Section Spacing:** `mb-6` (24px) between major sections
- **No Grid System** — Flexbox only, single-column mobile layout
- **Max Width:** None — full-width mobile layout
- **Scroll:** `ScrollView` with `keyboardShouldPersistTaps="handled"` for form-heavy screens
- **Lists:** `FlatList` for dynamic data, `refreshControl` for pull-to-refresh

## 6. Motion & Interaction

- **Transitions:** Fade-in for modals (`animationType="fade"`)
- **Press Feedback:** `activeOpacity={0.7}` for touchable elements
- **Loading States:** ActivityIndicator spinners, no skeleton animations
- **No Perpetual Animations** — static by default, motion only for state changes
- **No Spring Physics** — standard React Native transitions
- **No Staggered Reveals** — content appears immediately when loaded

## 7. Anti-Patterns (Banned)

- No emojis in UI text or labels
- No Inter font — Outfit is the designated typeface
- No pure black (#000000) — Charcoal Gray (#1F2937) is the darkest tone
- No neon glows or outer shadows
- No oversaturated accents — colors are muted and functional
- No gradient text on headers
- No custom mouse cursors (mobile-first)
- No overlapping elements
- No 3-column equal card layouts
- No generic placeholder names ("John Doe", "Admin")
- No fake round numbers
- No AI copywriting clichés ("Elevate", "Seamless", "Next-Gen")
- No filler UI text ("Scroll to explore", "Swipe down")
- No skeleton loaders — spinner-based loading only
- No decorative illustrations in empty states
- No heavy box shadows — border-based hierarchy only
- No floating labels on inputs — static labels above
- No gradient backgrounds — solid colors only
