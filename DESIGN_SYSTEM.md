# CampusPandit Design System

A comprehensive design system inspired by Zerodha's clean, minimalist aesthetic. This guide covers all design tokens, components, patterns, and best practices for building consistent, beautiful interfaces.

## 🎨 Design Philosophy

### Core Principles

**1. Clarity Over Complexity**
- Every element serves a purpose
- Remove unnecessary decoration
- Focus on content and functionality

**2. Consistency is Key**
- Predictable patterns across the platform
- Reusable components
- Standardized spacing and sizing

**3. Mobile-First Approach**
- Design for small screens first
- Progressive enhancement for larger screens
- Touch-friendly interactive elements

**4. Performance Matters**
- Lightweight components
- Optimized assets
- Fast load times

**5. Accessibility for All**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- Proper color contrast

## 🎨 Color System

### Brand Colors

#### Primary Blue
The main brand color used for primary actions, links, and key UI elements.

```css
primary-50:  #e8f4fd  /* Lightest tint */
primary-100: #d1e9fb
primary-200: #a3d3f7
primary-300: #75bdf3
primary-400: #47a7ef
primary-500: #387ed1  /* Main brand color */
primary-600: #2d65a8
primary-700: #224c7f
primary-800: #173256
primary-900: #0c192d  /* Darkest shade */
```

**Usage:**
- primary-500: Primary buttons, key CTAs, active states
- primary-100: Backgrounds for info cards
- primary-700: Hover states for buttons

#### Secondary Orange
Accent color for secondary actions and highlights.

```css
secondary-50:  #fef3e8
secondary-100: #fde7d1
secondary-200: #fbcfa3
secondary-300: #f9b775
secondary-400: #f79f47
secondary-500: #ff6f00  /* Main accent color */
secondary-600: #cc5900
secondary-700: #994300
secondary-800: #662c00
secondary-900: #331600
```

**Usage:**
- secondary-500: Secondary buttons, badges, highlights
- secondary-100: Warning backgrounds
- secondary-600: Hover states

#### Success Green
For positive states, confirmations, and success messages.

```css
success-50:  #e8f8f0
success-100: #d1f1e1
success-200: #a3e3c3
success-300: #75d5a5
success-400: #47c787
success-500: #00b386  /* Main success color */
success-600: #008f6b
success-700: #006b50
success-800: #004735
success-900: #00241a
```

**Usage:**
- success-500: Success buttons, positive indicators
- success-100: Success message backgrounds
- success-600: Hover states

#### Error Red
For errors, warnings, and destructive actions.

```css
error-50:  #fee8e8
error-100: #fdd1d1
error-200: #fba3a3
error-300: #f97575
error-400: #f74747
error-500: #eb5b3c  /* Main error color */
error-600: #bc4930
error-700: #8d3724
error-800: #5e2418
error-900: #2f120c
```

**Usage:**
- error-500: Error buttons, error text
- error-100: Error message backgrounds
- error-600: Hover states for destructive actions

#### Neutral Grays
For text, backgrounds, borders, and subtle UI elements.

```css
neutral-50:  #fafafa  /* Almost white */
neutral-100: #f5f5f5  /* Light background */
neutral-200: #e5e5e5  /* Subtle borders */
neutral-300: #d4d4d4  /* Default borders */
neutral-400: #a3a3a3  /* Placeholder text */
neutral-500: #737373  /* Secondary text */
neutral-600: #525252  /* Body text */
neutral-700: #404040  /* Emphasized text */
neutral-800: #262626  /* Headings */
neutral-900: #171717  /* Maximum contrast */
```

**Usage:**
- neutral-900: Headings, primary text
- neutral-600: Body text
- neutral-400: Placeholder text
- neutral-200: Borders
- neutral-50: Page backgrounds

### Color Usage Guidelines

**Do's:**
- Use primary-500 for main CTAs
- Use success-500 for positive actions
- Use error-500 for destructive actions
- Use neutral colors for text hierarchy
- Maintain 4.5:1 contrast ratio for text

**Don'ts:**
- Don't use multiple bright colors together
- Don't use colored text on colored backgrounds
- Don't use color as the only indicator
- Don't use gray text on white for important content

## 📏 Typography

### Font Family

```css
font-sans: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
font-display: Inter, system-ui, sans-serif
```

**Installation:**
Add to your `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Type Scale

```css
text-xs:   0.75rem  (12px) - line-height: 1rem    /* Small labels, captions */
text-sm:   0.875rem (14px) - line-height: 1.25rem /* Secondary text */
text-base: 1rem     (16px) - line-height: 1.5rem  /* Body text */
text-lg:   1.125rem (18px) - line-height: 1.75rem /* Emphasized body */
text-xl:   1.25rem  (20px) - line-height: 1.75rem /* Small headings */
text-2xl:  1.5rem   (24px) - line-height: 2rem    /* H4 */
text-3xl:  1.875rem (30px) - line-height: 2.25rem /* H3 */
text-4xl:  2.25rem  (36px) - line-height: 2.5rem  /* H2 */
text-5xl:  3rem     (48px) - line-height: 1       /* H1 */
text-6xl:  3.75rem  (60px) - line-height: 1       /* Display */
text-7xl:  4.5rem   (72px) - line-height: 1       /* Hero */
```

### Font Weights

```css
font-normal:    400  /* Body text */
font-medium:    500  /* Emphasized text, labels */
font-semibold:  600  /* Subheadings, button text */
font-bold:      700  /* Headings */
```

### Typography Examples

```jsx
// Headings
<h1 className="text-5xl font-bold text-neutral-900">Main Heading</h1>
<h2 className="text-4xl font-bold text-neutral-900">Section Heading</h2>
<h3 className="text-3xl font-semibold text-neutral-800">Subsection</h3>

// Body Text
<p className="text-base text-neutral-600">Regular paragraph text.</p>
<p className="text-sm text-neutral-500">Secondary information.</p>

// Labels
<label className="text-sm font-medium text-neutral-700">Form Label</label>
<span className="text-xs text-neutral-500">Helper text</span>
```

## 📐 Spacing System

### Base Unit: 4px (0.25rem)

All spacing values are multiples of 4px for consistent rhythm.

```css
0:    0px      /* No spacing */
1:    4px      /* 0.25rem */
2:    8px      /* 0.5rem */
3:    12px     /* 0.75rem */
4:    16px     /* 1rem */
5:    20px     /* 1.25rem */
6:    24px     /* 1.5rem */
8:    32px     /* 2rem */
10:   40px     /* 2.5rem */
12:   48px     /* 3rem */
16:   64px     /* 4rem */
20:   80px     /* 5rem */
24:   96px     /* 6rem */
32:   128px    /* 8rem */
```

### Spacing Usage

**Component Padding:**
- Small: `p-4` (16px)
- Medium: `p-6` (24px)
- Large: `p-8` (32px)

**Section Spacing:**
- Between sections: `py-20` (80px)
- Between groups: `gap-8` (32px)
- Between related items: `gap-4` (16px)

**Layout Margins:**
- Page padding: `px-4 sm:px-6 lg:px-8`
- Max content width: `max-w-7xl mx-auto`

## 🎯 Components

### Button

Primary interactive element for actions.

**Variants:**
- `primary`: Main call-to-action (blue)
- `secondary`: Secondary actions (orange)
- `outline`: Neutral actions with border
- `ghost`: Subtle actions without background
- `success`: Positive confirmations (green)
- `error`: Destructive actions (red)

**Sizes:**
- `sm`: Compact buttons (px-3 py-1.5, text-sm)
- `md`: Default size (px-4 py-2, text-base)
- `lg`: Prominent buttons (px-6 py-3, text-lg)

**States:**
- Default: Normal appearance
- Hover: Slightly darker background
- Active: Even darker background
- Disabled: 50% opacity, no pointer events
- Loading: Shows spinner, prevents interaction

**Usage:**
```jsx
import { Button } from './components/ui';

// Primary button
<Button variant="primary" size="md">
  Get started
</Button>

// Loading state
<Button variant="primary" loading>
  Submitting...
</Button>

// Full width
<Button variant="outline" fullWidth>
  Sign up
</Button>
```

### Card

Container component for grouped content.

**Variants:**
- `default`: Light border
- `bordered`: Thicker border for emphasis
- `elevated`: Shadow instead of border

**Padding:**
- `none`: No padding (for images, custom layouts)
- `sm`: 16px padding
- `md`: 24px padding (default)
- `lg`: 32px padding

**Usage:**
```jsx
import { Card } from './components/ui';

<Card variant="elevated" padding="md" hoverable>
  <h3 className="text-xl font-semibold mb-2">Card Title</h3>
  <p className="text-neutral-600">Card content goes here.</p>
</Card>
```

### Input

Text input field with label, error handling, and icons.

**Features:**
- Optional label
- Error states with messages
- Helper text
- Left/right icons
- Full width option

**Usage:**
```jsx
import { Input } from './components/ui';
import { Mail } from 'lucide-react';

<Input
  label="Email address"
  type="email"
  placeholder="you@example.com"
  leftIcon={<Mail className="w-5 h-5" />}
  helperText="We'll never share your email"
  fullWidth
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>
```

### Badge

Small label for status, categories, or counts.

**Variants:**
- `primary`: Blue badge
- `secondary`: Orange badge
- `success`: Green badge
- `error`: Red badge
- `neutral`: Gray badge

**Sizes:**
- `sm`: Compact (px-2 py-0.5, text-xs)
- `md`: Default (px-2.5 py-1, text-sm)
- `lg`: Large (px-3 py-1.5, text-base)

**Usage:**
```jsx
import { Badge } from './components/ui';

<Badge variant="success" dot>Active</Badge>
<Badge variant="error">Critical</Badge>
<Badge variant="primary" size="sm">New</Badge>
```

## 📱 Responsive Design

### Breakpoints

```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Desktops */
xl:  1280px  /* Large desktops */
2xl: 1536px  /* Extra large screens */
```

### Mobile-First Approach

Start with mobile styles, then add breakpoints for larger screens.

```jsx
// Mobile: stack vertically
// Tablet (md): 2 columns
// Desktop (lg): 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>
```

### Container Pattern

```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Responsive Typography

```jsx
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
  Responsive Heading
</h1>
```

## 🎭 Shadows

```css
shadow-sm:   0 1px 2px rgba(0,0,0,0.05)      /* Subtle depth */
shadow:      0 1px 3px rgba(0,0,0,0.1)       /* Default shadow */
shadow-md:   0 4px 6px rgba(0,0,0,0.1)       /* Cards */
shadow-lg:   0 10px 15px rgba(0,0,0,0.1)     /* Elevated cards */
shadow-xl:   0 20px 25px rgba(0,0,0,0.1)     /* Modals */
shadow-2xl:  0 25px 50px rgba(0,0,0,0.25)    /* Maximum depth */
```

**Usage:**
```jsx
<div className="shadow-md hover:shadow-lg transition-shadow">
  Card content
</div>
```

## 🔲 Border Radius

```css
rounded-sm:   0.25rem  (4px)   /* Subtle */
rounded:      0.375rem (6px)   /* Default */
rounded-md:   0.5rem   (8px)   /* Inputs, buttons */
rounded-lg:   0.75rem  (12px)  /* Cards */
rounded-xl:   1rem     (16px)  /* Large cards */
rounded-2xl:  1.5rem   (24px)  /* Containers */
rounded-3xl:  2rem     (32px)  /* Hero sections */
rounded-full: 9999px           /* Pills, avatars */
```

## 🎬 Animations

### Built-in Animations

```css
animate-fade-in:   Fade in (0.5s ease-in-out)
animate-slide-up:  Slide up (0.5s ease-out)
animate-slide-down: Slide down (0.3s ease-out)
animate-scale-up:  Scale up (0.3s ease-out)
```

### Transition Classes

```jsx
// Smooth transitions
className="transition-colors duration-200"
className="transition-all duration-300"
className="transition-transform duration-200"
```

### Animation Examples

```jsx
// Fade in on mount
<div className="animate-fade-in">
  Content
</div>

// Hover effects
<button className="transform hover:scale-105 transition-transform duration-200">
  Hover me
</button>

// Smooth color transitions
<a className="text-primary-500 hover:text-primary-600 transition-colors">
  Link
</a>
```

## 📐 Layout Patterns

### Navigation Bar

```jsx
<nav className="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      {/* Logo, menu, actions */}
    </div>
  </div>
</nav>
```

### Hero Section

```jsx
<section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 className="text-5xl font-bold mb-6">Hero Heading</h1>
        <p className="text-lg text-neutral-600 mb-8">Description</p>
        <Button variant="primary">Call to Action</Button>
      </div>
      <div>{/* Visual */}</div>
    </div>
  </div>
</section>
```

### Feature Grid

```jsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
  {features.map(feature => (
    <Card key={feature.id} hoverable>
      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
        {feature.icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
      <p className="text-neutral-600">{feature.description}</p>
    </Card>
  ))}
</div>
```

## ♿ Accessibility

### Focus States

Always provide visible focus indicators:

```jsx
className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Logical tab order
- Enter/Space to activate buttons
- Escape to close modals

### Screen Readers

```jsx
// Use semantic HTML
<button>Click me</button>

// Add ARIA labels when needed
<button aria-label="Close dialog">×</button>

// Hide decorative icons
<Icon aria-hidden="true" />

// Announce dynamic content
<div role="alert">Error message</div>
```

### Color Contrast

Minimum ratios (WCAG 2.1 AA):
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

## 🎨 Design Tokens

### Import in JavaScript/TypeScript

```typescript
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);

// Access colors
const primaryColor = fullConfig.theme.colors.primary[500];
```

## 📚 Best Practices

### Do's

✅ Use the design system components
✅ Follow spacing system (multiples of 4px)
✅ Maintain consistent typography scale
✅ Ensure sufficient color contrast
✅ Design mobile-first
✅ Add hover/focus states to interactive elements
✅ Use semantic HTML
✅ Keep animations subtle and purposeful

### Don'ts

❌ Create custom colors outside the palette
❌ Use arbitrary spacing values
❌ Mix different font families
❌ Ignore mobile responsiveness
❌ Forget keyboard navigation
❌ Overcomplicate layouts
❌ Use color alone to convey information

## 🔧 Development Setup

### Prerequisites

1. **Install dependencies:**
```bash
npm install
```

2. **Tailwind CSS is already configured** in `tailwind.config.js`

3. **Import fonts** in your `index.html` or `App.tsx`

### Using Components

```tsx
// Import individual components
import { Button, Card, Input, Badge } from './components/ui';

function MyComponent() {
  return (
    <Card padding="md">
      <h2 className="text-2xl font-bold mb-4">Welcome</h2>
      <Input label="Name" placeholder="Enter your name" />
      <Button variant="primary" className="mt-4">Submit</Button>
    </Card>
  );
}
```

## 📖 Resources

### Inspiration
- **Zerodha**: Clean, minimalist design
- **Stripe**: Developer-friendly documentation
- **Linear**: Modern, fast UI

### Tools
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Beautiful, consistent icon set
- **Inter Font**: Excellent web font for UI

### Documentation
- Tailwind CSS Docs: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintained by**: CampusPandit Design Team
