This indicates that Kimi probably applied the transition to the **mobile `Sheet` (overlay)** instead of the **desktop sidebar**.

Here's a refined prompt you can give it.

---

# Prompt for Kimi Code 2.7

The smooth collapse/expand animation is currently working only on **mobile**, because the mobile sidebar (`Sheet`) slides over the page.

However, **this is NOT what I want.**

## Problem

* ✅ Mobile overlay animation works.
* ❌ Desktop collapse/expand still feels abrupt.
* ❌ Desktop sidebar instantly switches between expanded and collapsed states.
* ❌ Child elements disappear before the width transition finishes.

The desktop sidebar should **not** behave like a mobile drawer.

---

# Important

**Do NOT modify the mobile implementation.**

Leave this completely unchanged:

* `Sheet`
* `SheetContent`
* Mobile overlay
* Mobile animations

The mobile experience is already correct.

---

# Only Improve Desktop Sidebar

Focus only on the desktop components:

* `Sidebar`
* `SidebarContainer`
* `SidebarGap`
* `SidebarMenuButton`
* `SidebarGroupLabel`
* `SidebarMenuSub`
* Any desktop-only sidebar components

The desktop sidebar already animates its width, but the contents change state immediately, making the animation look broken.

---

# Root Cause

The width transition is already present.

The issue is that when

```ts
state = "collapsed"
```

the following happen immediately:

* labels disappear
* submenu disappears
* padding changes
* width of buttons changes
* icons recalculate position

So the width animation is occurring, but the contents are not animating with it.

---

# Desired Desktop Behaviour

When collapsing:

1. Sidebar begins shrinking.
2. Text fades out while sliding 6–8px left.
3. Submenus fade out.
4. Padding reduces smoothly.
5. Width finishes.
6. Text becomes non-interactive.

When expanding:

1. Sidebar width grows.
2. After ~60ms the labels begin fading in.
3. Text slides back into place.
4. Submenus appear smoothly.
5. Everything finishes together.

The animation should feel similar to:

* Vercel
* Linear
* Notion

---

# Do NOT Use

Do not instantly apply:

```css
display: none;
```

or

```css
hidden
```

or

```css
visibility: hidden;
```

at the beginning of the animation.

Instead animate using:

* opacity
* transform
* max-width
* overflow
* pointer-events

Only hide after the animation completes if necessary.

---

# Desktop Animation Timing

Sidebar width

```css
240ms cubic-bezier(0.22,1,0.36,1)
```

Text

```css
180ms ease
```

Delay

```css
40ms
```

Submenus

```css
200ms ease
```

Everything should finish together.

---

# Investigate Existing Desktop Classes

Please inspect where these classes are applied:

```tsx
group-data-[collapsible=icon]
```

and determine whether they are instantly changing:

* size
* padding
* display
* opacity

These classes are likely causing the abrupt transition.

Refactor them so they animate smoothly instead of switching immediately.

---

# Deliverables

1. Do **not** touch the mobile `Sheet`.
2. Only improve desktop collapse/expand.
3. Make text, submenu, and spacing animate together with width.
4. Remove abrupt layout changes.
5. Preserve all existing functionality.
6. Explain which desktop components and CSS classes were modified and why.

---

### One additional observation

Looking at your sidebar implementation, I already see a likely culprit:

```tsx
group-data-[collapsible=icon]:size-8!
group-data-[collapsible=icon]:p-2!
group-data-[collapsible=icon]:hidden
```

These utility classes are applied immediately when the state changes, which means many elements jump to their collapsed styles before the container finishes animating. The solution isn't to slow down the width transition—it's to coordinate or delay these child style changes so they animate in sync with the sidebar width. This is where Kimi should focus its changes.
