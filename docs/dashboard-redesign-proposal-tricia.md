# Dashboard Redesign Proposal: Section-Based Layout

**From:** Tricia (UI/UX Designer)  
**To:** Mike (Frontend Developer)  
**Date:** February 11, 2026

---

## Overview

This proposal reorganizes the dashboard into three distinct, information-rich sections that group related data logically. Each section uses a consistent card-based layout within a glass morphism container, maintaining the existing design language while improving information hierarchy and usability.

---

## Design Principles

1. **Section-Based Organization**: Related information grouped into clear sections with descriptive headers
2. **Visual Hierarchy**: Each section has a distinct color accent for quick visual scanning
3. **Card Consistency**: All cards within sections follow the same visual pattern (glass, rounded-3xl, consistent padding)
4. **Real-Time Updates**: Energy flow diagram and statistics update in near real-time from Home Assistant
5. **Accessibility**: Maintain WCAG AA standards with proper contrast, semantic HTML, and ARIA labels

---

## Section 1: HOME OVERVIEW

**Purpose:** Display environmental and contextual information about the home.

**Section Container:**
- Glass card with `border-l-4 border-sky-500/50`
- Section header: "HOME OVERVIEW" with sky accent icon
- Grid layout: Responsive 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)

**Cards within section:**

### 1.1 Current Weather Card
- **Color accent:** Sky blue (`border-l-4 border-sky-400/60`)
- **Content:**
  - Large temperature display (primary metric)
  - Weather condition icon + description
  - Feels like temperature
  - Humidity percentage
  - Wind speed and direction
  - Last updated timestamp
- **Data source:** Home Assistant weather entity

### 1.2 Sun Data Card
- **Color accent:** Amber (`border-l-4 border-amber-400/60`)
- **Content:**
  - Current sun position (elevation angle)
  - Sunrise time (with countdown if before sunrise)
  - Sunset time (with countdown if before sunset)
  - Day length
  - Solar noon time
- **Visual:** Sun icon with position indicator
- **Data source:** Home Assistant sun sensor

### 1.3 Moon Data Card
- **Color accent:** Purple (`border-l-4 border-purple-400/60`)
- **Content:**
  - Moon phase (icon + name: "Waxing Crescent", "Full Moon", etc.)
  - Moon illumination percentage
  - Next full moon date
  - Next new moon date
  - Moonrise/moonset times (if available)
- **Visual:** Moon phase icon that updates based on current phase
- **Data source:** Home Assistant moon sensor or calculated from date

---

## Section 2: ENERGY

**Purpose:** Monitor and visualize energy production, consumption, and storage in real-time.

**Section Container:**
- Glass card with `border-l-4 border-emerald-500/60`
- Section header: "ENERGY" with lightning bolt icon
- Layout: Two-column grid (left: metric cards, right: power flow diagram)

**Cards within section:**

### 2.1 Current Power Consumption Card
- **Color accent:** Red/Orange (`border-l-4 border-orange-500/60`)
- **Content:**
  - Large power consumption value (kW)
  - Trend indicator (↑/↓) compared to previous hour
  - Estimated daily consumption projection
  - Peak consumption time today
- **Visual:** Power meter icon or gauge visualization
- **Data source:** Home Assistant energy sensor (grid consumption)

### 2.2 Solar Panel Output Card
- **Color accent:** Yellow (`border-l-4 border-yellow-500/60`)
- **Content:**
  - Current solar generation (kW)
  - Today's total generation (kWh)
  - Peak generation time today
  - Efficiency percentage (if available)
- **Visual:** Sun icon with rays
- **Data source:** Home Assistant solar sensor

### 2.3 Powerwall Battery Card
- **Color accent:** Cyan (`border-l-4 border-cyan-500/60`)
- **Content:**
  - Current battery level (%)
  - Battery capacity (kWh)
  - Current charge/discharge rate (kW)
  - Time to full/empty at current rate
  - Battery health status
- **Visual:** Battery icon with fill level
- **Data source:** Home Assistant Powerwall/Tesla integration

### 2.4 Power Flow Diagram (Interactive Graphic)
- **Position:** Right column, spans full height
- **Visualization:** Animated diagram showing energy flow direction
- **Components:**
  - **Solar panels** (top) → flows to battery or grid
  - **Battery** (center) → flows to home or grid
  - **Grid** (bottom) → flows to home or from home
  - **Home** (center) → consumption point
- **Flow indicators:**
  - Animated arrows showing direction
  - Color-coded: Green (solar), Cyan (battery), Orange (grid import), Yellow (grid export)
  - Width of arrows proportional to power flow (kW)
  - Real-time updates (every 5-10 seconds)
- **Labels:** Show kW values on each flow path
- **States:**
  - Solar → Battery → Home (solar charging battery, battery powering home)
  - Solar → Home + Grid (excess solar to grid)
  - Grid → Home (drawing from grid)
  - Battery → Grid (selling battery power)
- **Implementation:** SVG or Canvas-based diagram with React state updates
- **Data source:** Home Assistant energy sensors (solar, battery, grid import/export)

---

## Section 3: USAGE STATISTICS

**Purpose:** Historical analysis and cost tracking of energy consumption.

**Section Container:**
- Glass card with `border-l-4 border-purple-500/60`
- Section header: "USAGE STATISTICS" with chart icon
- Layout: Full-width section with tabbed or segmented control for time periods

**Content:**

### 3.1 Power Consumption Graphs
- **Time period selector:** Day | Week | Month | Year (tabs or segmented control)
- **Graph 1: Consumption Over Time**
  - Line or area chart
  - X-axis: Time (hours/days/months)
  - Y-axis: Power (kW) or Energy (kWh)
  - Multiple series: Total consumption, Solar generation, Grid import/export
  - Interactive: Hover to see exact values
  - Tooltip: Shows timestamp and all values at that point
- **Graph 2: Consumption Breakdown**
  - Stacked bar chart or pie chart
  - Shows: Solar vs Grid vs Battery usage
  - Percentage breakdown
- **Graph 3: Peak Usage Times**
  - Heatmap or bar chart
  - Shows consumption by hour of day
  - Highlights peak hours

### 3.2 Energy Cost Data
- **Card: Current Period Costs**
  - Today's cost
  - This week's cost
  - This month's cost
  - Comparison to previous period (% change)
- **Card: Cost Breakdown**
  - Cost by source (Grid import cost, Solar savings, Battery savings)
  - Average cost per kWh
  - Peak cost period
- **Graph: Cost Over Time**
  - Line chart showing daily/weekly/monthly costs
  - Comparison line for previous period
  - Projected monthly cost based on current usage

**Data source:** Home Assistant energy sensors + configured electricity rates

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Navigation Bar (existing)                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ HOME OVERVIEW                    [Sky accent]    │ │
│ ├───────────────────────────────────────────────────┤ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│ │ │ Weather  │ │   Sun    │ │   Moon   │          │ │
│ │ │  Card    │ │   Card   │ │   Card   │          │ │
│ │ └──────────┘ └──────────┘ └──────────┘          │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ENERGY                            [Emerald accent]│ │
│ ├───────────────────────────────────────────────────┤ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │
│ │ │  Power   │ │  Solar   │ │                    │ │ │
│ │ │Consumption│ │  Output  │ │   Power Flow      │ │ │
│ │ └──────────┘ └──────────┘ │     Diagram       │ │ │
│ │ ┌──────────┐               │   (Interactive)   │ │ │
│ │ │ Battery  │               │                    │ │ │
│ │ └──────────┘               └──────────────────┘ │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ USAGE STATISTICS                  [Purple accent]│ │
│ ├───────────────────────────────────────────────────┤ │
│ │ [Day] [Week] [Month] [Year]  ← Time period tabs  │ │
│ │                                                      │ │
│ │ ┌──────────────────────────────────────────────┐ │ │
│ │ │  Consumption Over Time Graph                 │ │ │
│ │ └──────────────────────────────────────────────┘ │ │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐        │ │ │
│ │ │  Cost    │ │ Breakdown │ │   Peak   │        │ │ │
│ │ │  Card    │ │   Card    │ │   Card   │        │ │ │
│ │ └──────────┘ └──────────┘ └──────────┘        │ │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Color Palette

| Section/Element | Color | Tailwind Class | Usage |
|----------------|-------|----------------|-------|
| Home Overview | Sky | `border-sky-500/50` | Section border |
| Weather Card | Sky | `border-sky-400/60` | Card accent |
| Sun Card | Amber | `border-amber-400/60` | Card accent |
| Moon Card | Purple | `border-purple-400/60` | Card accent |
| Energy Section | Emerald | `border-emerald-500/60` | Section border |
| Power Consumption | Orange | `border-orange-500/60` | Card accent |
| Solar Output | Yellow | `border-yellow-500/60` | Card accent |
| Battery | Cyan | `border-cyan-500/60` | Card accent |
| Usage Statistics | Purple | `border-purple-500/60` | Section border |

---

## Responsive Behavior

- **Mobile (< 768px):** Single column layout, cards stack vertically
- **Tablet (768px - 1024px):** 2-column grid for cards, power flow diagram full width below cards
- **Desktop (> 1024px):** 3-column grid for Home Overview, 2-column layout for Energy section

---

## Implementation Notes for Mike

1. **Data Fetching:** Create API endpoints or use existing Home Assistant integration to fetch:
   - Weather entities
   - Sun sensor data
   - Moon phase calculation
   - Energy sensors (consumption, solar, battery, grid)
   - Historical energy data for graphs

2. **Real-Time Updates:**
   - Use WebSocket or polling (every 5-10 seconds) for energy flow diagram
   - Update statistics graphs on time period change
   - Show loading states during data fetch

3. **Power Flow Diagram:**
   - Consider using a library like D3.js, Recharts, or custom SVG
   - Animate flow arrows based on power direction and magnitude
   - Make diagram interactive (hover for details, click to expand)

4. **Graphs:**
   - Use Recharts or Chart.js for consumption and cost graphs
   - Ensure graphs are responsive and accessible
   - Add export functionality (optional: download as PNG/CSV)

5. **Accessibility:**
   - Use semantic HTML (`<section>`, `<article>`)
   - Add ARIA labels for graphs and diagrams
   - Ensure keyboard navigation works
   - Provide text alternatives for visual data

---

## Next Steps

1. Review this proposal with the team
2. Confirm data availability from Home Assistant
3. Create detailed component specifications
4. Implement in phases:
   - Phase 1: Home Overview section
   - Phase 2: Energy section (cards + basic flow diagram)
   - Phase 3: Usage Statistics section
   - Phase 4: Enhanced interactivity and animations

---

**Questions or feedback?** Let's discuss before implementation begins.
