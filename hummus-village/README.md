# Hummus Village — Website

A 5-page static website for Hummus Village restaurant in Dunwoody, Georgia.

## What's inside

```
hummus-village/
├── index.html          Home
├── menu.html           Full menu (Village Plates, Village Pita, Dessert & Drinks)
├── about.html          Chef Haim Javits story
├── catering.html       Catering tiers, menu, ordering process
├── contact.html        Address, phones, hours, social, contact form
├── css/
│   └── style.css       All styles — design tokens, components, page styles
├── js/
│   └── main.js         Vanilla JS — nav, mobile menu, reveals, counter, parallax
└── images/             Logo + 15 food photos
```

## Tech

Pure HTML5, CSS3, and Vanilla JavaScript. No frameworks, no build step, no dependencies except Google Fonts (Playfair Display, Lora, Satisfy).

## Deployment

Drop the entire folder onto any static host: Netlify, Vercel, GitHub Pages, S3 + CloudFront, traditional shared hosting. No build command needed — it's already built.

For local preview, run a simple HTTP server from the folder root:

```
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Notes for the developer

- **Contact form:** Currently uses `action="mailto:hummusvillage@gmail.com"`. Replace with the real client email or swap for a Formspree / Netlify Forms / Basin endpoint before going live.
- **Google Maps:** The embed in `index.html` and `contact.html` works out of the box on a public domain. It will not render when previewing via `file://` due to browser cross-origin restrictions — that's expected and not a bug.
- **Phone numbers:** `770-902-4454` (primary) and `678-580-2215` (secondary) appear sitewide as `tel:` links.
- **Logo:** `images/logo.jpeg` — replace with a higher-resolution PNG with transparent background when available, no other code changes needed.

## Brand tokens (defined in `css/style.css` `:root`)

| Token | Value |
|---|---|
| `--color-coral` | `#E85C3A` (primary accent) |
| `--color-gold` | `#D4A017` (price + accents) |
| `--color-olive` | `#6B7C3A` (eyebrow labels, motifs) |
| `--color-brown` | `#2C1A0E` (dark sections) |
| `--color-cream` | `#FAF6EE` (default page bg) |
| `--color-white-warm` | `#FFFDF8` (alternating bg) |
| `--font-display` | Playfair Display (all headings) |
| `--font-body` | Lora (all body text) |
| `--font-script` | Satisfy (taglines only — sparingly) |

## Accessibility

- Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`)
- Skip-to-content not included (single-page hierarchy keeps tab order short)
- All images have descriptive `alt` text
- All form inputs have associated `<label>` elements
- Mobile menu manages `aria-expanded` and `aria-controls`
- `prefers-reduced-motion` is respected throughout — entrance animations and parallax disabled when user prefers reduced motion
- WCAG AA contrast ratios met on all body text and headings

## Browser support

Chrome, Firefox, Safari, Edge — latest versions. Uses CSS custom properties, IntersectionObserver, and modern Flex/Grid. No fallbacks needed for modern browsers.
