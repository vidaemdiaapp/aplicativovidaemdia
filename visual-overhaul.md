# Visual Overhaul Plan: Vida em Dia

> **Status**: Planning
> **Agent**: Frontend Specialist
> **Style**: Liquid Obsidian

## Phase 1: Deep Design Thinking & Analysis

### Context Analysis
-   **Sector**: Personal Management / Life OS.
-   **Soul**: Control, Clarity, Energy.
-   **Current State**: Standard "Sky Blue" SaaS look. Safe but forgettable.
-   **Goal**: Create an "Unforgettable" implementation that motivates the user.

### 🎨 DESIGN COMMITMENT: LIQUID OBSIDIAN

-   **Topological Choice**:
    -   Killing the "Sidebar + Main Content" standard dashboard layout.
    -   Moving to a **"Floating Command Center"**: Navigation is a floating dock or island. Content flows continuously.
    -   **Asymmetry**: Key metrics will not be in equal boxes. The most important metric (e.g., "Daily Score") will be massive, breaking the grid.

-   **Risk Factor**:
    -   **Dark Mode Only**: We are shifting to a permanent high-contrast dark mode foundation (Obsidian). Light mode is secondary or removed for the "Premium" feel.
    -   **Sharp Edges**: 0px border-radius on containers, contrasting with fluid organic background shapes.
    -   **Neon Accents**: Replacing safe blue with **Electric Lime (#bef264)** or **Acid Green**.

-   **Cliché Liquidation**:
    -   ☠️ **killed**: `grid-cols-3` generic dashboard.
    -   ☠️ **killed**: `bg-slate-50` light backgrounds.
    -   ☠️ **killed**: `rounded-xl` soft corners on everything.
    -   ☠️ **killed**: "Sky Blue" primary color.

## Phase 2: Design Systems & Tokens (Implementation Plan)

### 1. Typography & Geometry
-   **Font**: Inter (Clean) or Space Grotesk (Tech). I recommend sticking to **Inter** for readability but using **Tight** tracking for headers.
-   **Radius**: `0px` for cards, `999px` for pills/buttons. No middle ground.

### 2. Color Palette (Obsidian & Lime)
-   **Background**: `#0a0a0a` (Solid Black) to `#171717` (Neutral 900).
-   **Surface**: `#262626` (Neutral 800) with thin `#404040` borders.
-   **Primary (Action)**: `#bef264` (Lime 300) or `#d9f99d` (Lime 200).
-   **Text**: `#fafafa` (White) and `#a3a3a3` (Neutral 400).
-   **Destructive**: `#ef4444` (keeping standard red for safety, but high saturation).

### 3. Animation Strategy
-   **Entrance**: All pages stagger children on load.
-   **Hover**: Buttons do not just change color; they `translate-y-1` and `shadow-glow`.
-   **Data**: Charts animate on entry.

## Phase 3: Refactoring Execution Steps

1.  **Foundation (`index.css`)**:
    -   Wipe existing `@theme`.
    -   Implement new Tailwind v4 theme (Obsidian/Lime).
    -   Add base styles for dark mode.

2.  **Layout Components**:
    -   Create `Layout.tsx` with "Floating Dock" navigation.
    -   Refactor `Sidebar` to be a minimal icons-only or hidden menu.

3.  **Component Refactor (Batch 1)**:
    -   `Button.tsx`: Convert to "Sharp & Bold".
    -   `Card.tsx`: Remove shadows, add thin borders, dark backgrounds.
    -   `Input.tsx`: Minimal underline or flat dark box.

4.  **Screens**:
    -   **Home**: Transform into a "Command Center".
    -   **Finance**: Dark data visualization (Neon lines on dark bg).

## User Confirmation
I am ready to execute this **Liquid Obsidian** overhaul.
-   **Do you accept the "Dark Mode + Electric Lime" direction?**
-   **Do you accept the "Sharp Edges (Brutalist)" geometry?**

Wait for your go-ahead to start the `index.css` rewrite.
