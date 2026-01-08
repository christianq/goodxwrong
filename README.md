# Fluid Engine Page Builder

A Squarespace 7.1 Fluid Engine-inspired web page builder built with React, TypeScript, and Vite.

## Features

- **Section-based Layout**: Stack full-width sections vertically, each with customizable height and background
- **Multiple Element Types**: Text, Image (placeholder), Button, and Block elements
- **Free-form Positioning**: Drag elements anywhere within a section
- **8-point Resize Handles**: Resize from any corner or edge
- **Smart Snapping**: Snap to grid lines, section centers, and other element edges
- **Visual Guides**: Snap lines, spacing indicators, alignment badges, and collision hints
- **Responsive Breakpoints**: Separate layouts for Desktop (1200px) and Mobile (375px)
- **Undo/Redo**: Full history stack with Cmd+Z / Cmd+Shift+Z
- **Keyboard Shortcuts**: Arrow keys to nudge, Delete to remove, Cmd+D to duplicate
- **Import/Export**: Save and load pages as JSON

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Interaction Cheatsheet

### Mouse

| Action | Behavior |
|--------|----------|
| Click element | Select element |
| Shift+Click element | Add/remove from selection |
| Click section background | Select section |
| Shift+Drag on section | Marquee selection |
| Double-click section | Add text element at cursor |
| Drag element | Move (shows snap guides) |
| Drag resize handle | Resize element |
| Shift+Drag resize | Lock aspect ratio |
| Alt/Option+Drag resize | Resize from center |

### Keyboard

| Shortcut | Action |
|----------|--------|
| Arrow keys | Nudge 1px |
| Shift+Arrow | Nudge 10px |
| Delete/Backspace | Delete selected |
| Cmd/Ctrl+D | Duplicate selected |
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z | Redo |

### Toolbar

- **Add Elements**: Click Text, Image, Button, or Block to add to current/first section
- **Undo/Redo**: Arrow buttons
- **Snap Toggle**: Enable/disable snapping
- **Breakpoint Toggle**: Switch between Desktop and Mobile views
- **Zoom**: Adjust canvas zoom level
- **Import/Export**: Load or save page JSON

## Data Model

### Page JSON Structure

```json
{
  "sections": [
    {
      "id": "section-hero",
      "name": "Hero Section",
      "height": 600,
      "background": {
        "type": "color",
        "value": "#f8fafc"
      },
      "grid": {
        "columns": 12,
        "rowHeight": 40,
        "gap": 20,
        "visible": true,
        "snapStrength": "strong"
      },
      "order": 0
    }
  ],
  "elements": [
    {
      "id": "elem-title",
      "sectionId": "section-hero",
      "type": "text",
      "content": {
        "text": "Welcome",
        "fontSize": 48,
        "fontWeight": 700,
        "color": "#0f172a",
        "fontFamily": "Inter, system-ui, sans-serif"
      },
      "layout": {
        "desktop": { "x": 200, "y": 180, "w": 500, "h": 70, "z": 1 },
        "mobile": { "x": 20, "y": 100, "w": 280, "h": 80, "z": 1 }
      },
      "locked": false,
      "visible": true
    }
  ]
}
```

### Element Types

**Text**
```json
{
  "type": "text",
  "content": {
    "text": "Hello World",
    "fontSize": 16,
    "fontWeight": 400,
    "color": "#1a1a1a",
    "fontFamily": "Inter, system-ui, sans-serif"
  }
}
```

**Image**
```json
{
  "type": "image",
  "content": {
    "src": "https://example.com/image.jpg",
    "alt": "Description",
    "objectFit": "cover"
  }
}
```

**Button**
```json
{
  "type": "button",
  "content": {
    "label": "Click Me",
    "backgroundColor": "#2563eb",
    "textColor": "#ffffff",
    "borderRadius": 8
  }
}
```

**Block**
```json
{
  "type": "block",
  "content": {
    "backgroundColor": "#e5e7eb",
    "borderRadius": 0,
    "borderWidth": 0,
    "borderColor": "#d1d5db"
  }
}
```

## Architecture

```
src/
├── components/
│   ├── Canvas/         # Main canvas and sections
│   ├── Elements/       # Draggable elements with resize
│   ├── Inspector/      # Right sidebar for properties
│   ├── SectionRail/    # Left sidebar for section list
│   ├── SmartGuides/    # SVG overlay for guides
│   ├── Toolbar/        # Top toolbar
│   └── Hud/            # Position/size HUD during drag
├── engine/
│   └── snapping.ts     # Snap calculation engine
├── hooks/
│   ├── useDrag.ts      # Drag interaction
│   ├── useResize.ts    # Resize interaction
│   ├── useMarquee.ts   # Marquee selection
│   └── useKeyboard.ts  # Keyboard shortcuts
├── store/
│   └── pageStore.ts    # Zustand store with undo/redo
├── types/
│   └── index.ts        # TypeScript definitions
└── utils/
    └── geometry.ts     # Geometry utilities
```

## Running Tests

```bash
npm test
```

## Smart Guide Behavior

### Snapping Priority

1. **Element edges** (highest priority) - Snap to other elements' left/right/top/bottom edges
2. **Element centers** - Snap to other elements' center lines
3. **Section center** - Snap to the horizontal/vertical center of the section
4. **Grid lines** - Snap to column and row grid lines

### Visual Indicators

- **Snap lines**: Dashed lines appear when snapping occurs (color-coded by source)
- **Spacing indicators**: Show distance between elements when close
- **Alignment badges**: Brief toast showing "center", "middle" when aligning
- **Collision hints**: Red outline when >30% overlap with another element

### Snap Threshold

Elements magnetize to snap targets within 8 pixels. The snapping "strength" can be toggled:
- **Strong**: Full snapping to grid and elements
- **Weak**: Reduced snap priority for grid
- **Off**: No grid snapping (element snapping still works)

## Performance

- Uses `requestAnimationFrame` for smooth 60fps during drag/resize
- Drag state stored in refs to minimize React re-renders
- CSS transforms for preview positioning (GPU accelerated)
- Commits to store state only on pointer up

## License

MIT
