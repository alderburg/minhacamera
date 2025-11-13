# MinhaCamera.com Design Guidelines

## Design Approach
**System**: Modern SaaS Dashboard Pattern (inspired by Linear, Vercel, and Carbon Design)
**Rationale**: Utility-focused camera management system requiring clear information hierarchy, efficient data visualization, and reliable video playback. White-label nature demands neutral, professional foundation.

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for technical data like IP addresses, RTSP URLs)

**Scale**:
- Headings: text-2xl (dashboard titles), text-xl (section headers), text-lg (card headers)
- Body: text-base (default), text-sm (secondary info, table data)
- Captions: text-xs (timestamps, status labels, metadata)
- Weight: font-normal (body), font-medium (labels), font-semibold (headings), font-bold (emphasis)

## Layout & Spacing

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Container margins: mx-4, mx-6

**Grid System**:
- Desktop sidebar: Fixed 16rem (w-64) left sidebar
- Main content: flex-1 with max-w-7xl container
- Camera grids: grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Data tables: Full width with horizontal scroll on mobile

## Desktop Interface Structure

**Sidebar Navigation**:
- Fixed left sidebar (w-64)
- Logo/company branding at top (h-16)
- Navigation items: py-2 px-4, rounded-lg hover states
- Icons from Heroicons (24px) with labels
- User profile/logout at bottom
- Subtle dividers between sections

**Main Content Area**:
- Top bar: h-16 with breadcrumbs, search, notifications
- Content wrapper: p-6 lg:p-8
- Cards: rounded-xl border with p-6
- Page headers: mb-8 with title + action buttons aligned

## Mobile Interface (App-like)

**Top Bar**: 
- Fixed h-14 with company logo (left) and notification icon (right)
- No navigation items (lives in bottom bar)

**Bottom Navigation**:
- Fixed h-16 with 3-4 icons
- Icons: 24px Heroicons with labels (text-xs)
- Active state with indicator

**Content**: 
- Full viewport minus top/bottom bars
- Padding: p-4
- Camera cards stack vertically with aspect-ratio-video

## Component Library

### Video Player Container
- Aspect ratio: 16:9 (aspect-w-16 aspect-h-9)
- Rounded corners: rounded-lg
- Status overlay: Absolute positioned badge (top-right)
- Controls: Fullscreen icon (bottom-right), hover-visible

### Camera Grid
- Desktop: 2x2 default, 3x3 option, 4x4 for large screens
- Mobile: Single column, full width
- Gap: gap-4
- Each card: Camera name (text-sm font-medium), status indicator, expand button

### Status Indicators
- Online: Small dot (h-2 w-2) with pulse animation
- Offline: Static dot
- Label: text-xs font-medium ml-2

### Data Tables
- Header: text-xs font-medium uppercase tracking-wide
- Rows: py-3 px-4 border-b hover:bg-subtle
- Actions: Right-aligned icon buttons (24px)
- Mobile: Card-based fallback with stacked data

### Forms
- Input fields: h-10, rounded-md, border, px-3
- Labels: text-sm font-medium mb-1.5
- Helper text: text-xs
- Buttons: h-10 px-4 rounded-md, primary + secondary variants
- Form groups: space-y-4

### Dashboard Cards
- Statistics cards: p-6 rounded-xl border
- Icon container: h-12 w-12 rounded-lg (for metric icons)
- Metric value: text-3xl font-bold
- Metric label: text-sm
- Layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4

### Modals/Dialogs
- Backdrop: Semi-transparent overlay
- Panel: max-w-2xl, rounded-xl, p-6
- Header: text-xl font-semibold mb-4
- Footer: Flex justify-end with button group gap-3

### Badges
- Role badges: px-2 py-1 rounded-full text-xs font-medium
- Camera count: Inline with subtle background

## Animation Guidelines
**Minimal Animations Only**:
- Page transitions: None (instant navigation)
- Hover states: Subtle background shifts (transition-colors duration-150)
- Status pulse: Only for "online" indicators
- Modal/dropdown: Simple fade-in (no slide/scale)
- Loading: Spinner only when necessary (not skeleton screens)

## Accessibility
- All interactive elements: min-h-10 (44px touch target)
- Form inputs: Consistent height (h-10) with visible focus rings
- Icons: Always paired with aria-labels
- Camera feeds: Alt text describing camera name/location
- Keyboard navigation: Full support with visible focus indicators

## Icons
**Library**: Heroicons via CDN
- Navigation: 24px outline icons
- Buttons: 20px solid icons
- Status: 16px for inline indicators
- Camera controls: 32px for primary actions (fullscreen, etc.)

## Responsive Breakpoints
- Mobile: < 768px (bottom nav, stacked layout)
- Tablet: 768px - 1024px (sidebar collapses to icons-only option)
- Desktop: > 1024px (full sidebar, multi-column grids)

## White-Label Considerations
- Logo upload: Constrained to h-8 or h-10 max
- Custom domain display in top bar
- Neutral structural design allows easy color theming
- Typography and spacing remain consistent across tenants