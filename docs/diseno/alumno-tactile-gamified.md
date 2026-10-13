---
name: Tactile Gamified Learning
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3f4a36'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#6f7b64'
  outline-variant: '#becbb1'
  surface-tint: '#2b6c00'
  primary: '#2b6c00'
  on-primary: '#ffffff'
  primary-container: '#58cc02'
  on-primary-container: '#1e5000'
  inverse-primary: '#6be026'
  secondary: '#006590'
  on-secondary: '#ffffff'
  secondary-container: '#2fb8ff'
  on-secondary-container: '#004666'
  tertiary: '#755b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ddad00'
  on-tertiary-container: '#574300'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#87fe45'
  primary-fixed-dim: '#6be026'
  on-primary-fixed: '#082100'
  on-primary-fixed-variant: '#1f5100'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#88ceff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdf92'
  tertiary-fixed-dim: '#f4bf00'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  headline-xl:
    fontFamily: Nunito Sans
    fontSize: 36px
    fontWeight: '900'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Nunito Sans
    fontSize: 28px
    fontWeight: '900'
    lineHeight: 34px
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 28px
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 28px
  headline-sm:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 26px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-lg:
    fontFamily: Nunito Sans
    fontSize: 15px
    fontWeight: '800'
    lineHeight: 20px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Nunito Sans
    fontSize: 13px
    fontWeight: '800'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  gutter-desktop: 1.5rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system establishes an energetic, rewarding, and deeply tactile environment tailored for young learners, students, and guided educational experiences. The core aesthetic merges tactile micro-skeuomorphism with modern playful flat illustration principles.

Key stylistic pillars:
- **Playful & Tactile:** Interface elements mimic physical game pieces, chunky plastic buttons, and punchy collectible tokens. Interactions emphasize satisfying physical feedback through simulated depression states.
- **Supportive & Friendly:** Shapes are ultra-rounded with soft continuous curves, preventing any visual harshness. Microcopy is encouraging, clear, and gamified.
- **High-Clarity Contrast:** Structural 2px container borders paired with distinct shaded baseline lips create immediate spatial legibility, making tasks effortlessly decipherable for children.

## Colors

The palette revolves around vibrant, hyper-saturated gamification hues rooted in distinct semantic roles:

- **Primary (`#58CC02` - Feather Green):** Core actions, primary progress advancement, success states, and foundational CTA buttons. Paired with a darker bottom shadow lip `#46A302`.
- **Secondary (`#1CB0F6` - Sky Blue):** Navigation triggers, secondary action cards, active selection pills, and tutor prompts. Shadow lip: `#1899D6`.
- **Tertiary (`#FFC800` - Gold / Amber):** Rewards, streaks, stars, experience points, and high-value celebratory achievements. Shadow lip: `#E5A500`.
- **Accent Warm (`#FF9600` - Fox Orange):** Attention markers, energy meters, and interactive challenge banners. Shadow lip: `#D87F00`.
- **Accent Alert (`#FF4B4B` - Cardinal Red):** Lives, hearts, error states, and reset actions. Shadow lip: `#EA2B2B`.
- **Neutral Light & Surface (`#F7F7F7` to `#FFFFFF`):** High-brightness backgrounds that allow gamified colored elements to pop.
- **Neutral Outlines (`#E5E5E5`):** Universal 2px container perimeter border that preserves clean component boundaries without heavy visual weight.
- **Neutral Dark (`#4B4B4B` to `#1C1C1C`):** High-contrast typography for effortless legibility.

## Typography

The typography uses **Nunito Sans** across all hierarchies to ensure high legibility paired with rounded terminals that match the bubbly, friendly UI geometry.

- **Headlines:** Set in extra-bold and black weights (800–900). Characters feature rounded counters and warm curves, conveying authority without severity.
- **Labels & Interactive Triggers:** Set in uppercase or bold casing with slight positive letter tracking (+0.03em to +0.05em) to optimize quick scanning on 3D pressed buttons.
- **Body Text:** Uses medium to semi-bold weights (600) to keep reading effortless against white and off-white backdrops, specifically tuned for young readers.

## Layout & Spacing

The layout architecture employs a structured fluid-to-fixed canvas system focused on direct task completion and conversational learning:

- **Desktop (min-width: 1024px):** A central bounded container (max-width: 1080px) flanked by utility rails or structured split grids (such as left sidebar navigation / tutor context, right task execution). Margin set to `3rem` with `1.5rem` gutters.
- **Tablet (640px – 1023px):** A balanced 8-column layout with `1.5rem` outer margins. Interactive panels stack gracefully while preserving button touch sizes.
- **Mobile (< 640px):** Single-column stacked layout with minimum `1.25rem` margins. Touch targets remain large (minimum height of 48px to 52px). Bottom action strips become sticky with elevated 3D tactile buttons.

## Elevation & Depth

Visual depth is communicated physically through **solid directional offset borders** rather than diffuse blurry drop shadows. This mechanical "pressed-toy" tactile language provides clear, immediate affordance:

- **Interactive Level 1 (Solid 3D Elevation):** Buttons and active cards feature a flat background, a full 2px structural outline, and a solid 4px bottom border (e.g., `border-b-4` in their designated shade color).
- **Interactive Depressed State (`:active`):** On press or click, the bottom border collapses (`border-b-0` or `border-b-2`), and the element shifts downward vertically (`translate-y-[2px]` or `translate-y-[4px]`), simulating a tactile plastic keyboard key.
- **Card Depth:** Large dashboard cards feature a 2px all-around border in `#E5E5E5` paired with an optional 3px to 4px solid drop lip `#E5E5E5`, creating crisp separation from the `#F7F7F7` page canvas.
- **Float Overlays:** Modals and bottom sheets use a high-contrast backdrop scrim (`rgba(0, 0, 0, 0.45)`) combined with a 4px solid shadow edge in `#D6D6D6`.

## Shapes

The design system embraces deep corner curvature to evoke friendly, approachable educational tools:

- **Standard Buttons & Inputs:** Formed with `rounded-2xl` (1rem / 16px) curvature.
- **Dashboard Containers & Activity Cards:** Framed with `rounded-3xl` (1.5rem to 2rem) radii to soften heavy task blocks.
- **Pills, Badges & Chips:** Completely circular or capsule rounded (`rounded-full`) for continuous tactile roll.
- **Borders:** Consistent uniform 2px stroke width on all outlines ensures a cohesive illustrated storybook aesthetic.

## Components

### 3D Pressed Buttons
- **Primary:** Background `#58CC02`, text `#FFFFFF`, border-b-4 `#46A302`. Hover increases brightness slightly. Active state executes `translate-y-1` and collapses `border-b-0`.
- **Secondary (Sky):** Background `#1CB0F6`, border-b-4 `#1899D6`.
- **Outline / Ghost:** Background `#FFFFFF`, 2px border `#E5E5E5`, border-b-4 `#CECECE`, text `#4B4B4B`. Active collapses to flat with `translate-y-1`.
- **Destructive:** Background `#FF4B4B`, border-b-4 `#EA2B2B`.

### Gamified Status Chips & Counters
- Capsule-shaped (`rounded-full`) badges showcasing streaks, stars, gems, or lives.
- Composed of a crisp 2px border in `#E5E5E5` or matching token tint, containing a vibrant 20px icon (flame, heart, gem, star) alongside bold numeric labels (`font-black text-sm`).

### Activity & Mission Cards
- White surface `#FFFFFF` bounded by a 2px `#E5E5E5` stroke and `rounded-2xl` corners.
- Displays category chips (e.g., "Proyecto", "10 min"), bold headline task titles, and dual-action bottom buttons: tactile primary action ("Resolver") and flat outline action ("Ya la terminé").

### Interactive Choice Chips & Idea Bubbles
- Pill-shaped prompt triggers (`rounded-full`) with `#FFFFFF` background, 2px border in `#E5E5E5`, and dark bold text.
- Hover changes outline to `#1CB0F6` with subtle lift. Selection fills the container with `#DDF4FF` and a `#1CB0F6` border.

### Chat & Tutor Bubble Container
- Tutor dialogues render with distinct, friendly rounded corners (`rounded-2xl`, with the speech corner tightened to `rounded-sm`).
- Styled with a soft off-white or light neutral tint (`#F9F9F9`), 2px border `#E5E5E5`, and an avatar badge marking the character guide.

### Form Inputs & Search Fields
- Inset pill or `rounded-2xl` containers with 2px borders `#E5E5E5`.
- Focus state switches border to 2px `#1CB0F6` without soft blur halos. Accompanied by circular 3D icon action buttons (e.g., microphone, send arrow).