# Bring saai.pro's animation effects to your portfolio

saai.pro uses five effects. The plan rebuilds each one in your orange and green colours. Your text and layout stay the same.

## 1. "Agents build the page" opening (main effect)
- The current short arrow intro gets replaced.
- When the page opens it starts out blank. Coloured arrow "agents" fly in and paint it in from top to bottom, one block at a time: headline, photo, cards, and so on.
- Scrolling down moves the build forward. A bottom bar shows "N agents ready", a progress line, a speed button (1x / 2x), a "Go live" button that skips straight to the finished site, and a close button.
- Optional soft click sounds stay off until the visitor taps "Tap for sound".
- It plays on every visit, like saai.pro. Visitors who have turned down motion in their device settings get the finished site straight away.

## 2. Moving background
- The flat glow behind the top section becomes a slowly drifting pattern of lines and rings in deep orange. It eases toward the mouse.
- It pauses when it's off screen to save battery.

## 3. Depth on the photo and cards
- Your photo and the top cards shift slightly as the mouse moves, which gives a layered, 3D feel.
- Each section's heading and items slide in one after another as you scroll.

## 4. Floating section dock
- A small floating menu at the bottom shows which section you're in and lights up as you scroll.

## 5. Interactive extras
- **Project filters:** All, AI/LLM, Vision, Research. The cards animate as you switch.
- **Copy-email message:** clicking your email shows a small "Copied" pop-up.

## Technical details
- New `src/components/swarm/`: a canvas overlay. It takes each `[data-build]` block's position and uses a clip-path mask to reveal blocks in order while agent sprites travel to each block. A scroll listener moves the build forward. WebAudio provides the click sounds.
- The background becomes a canvas with rAF and an IntersectionObserver pause, plus eased mouse tracking.
- Parallax uses a small `useMouseParallax` hook with CSS transforms.
- The dock and filters are plain React state, with the existing Reveal reused for the staggered slide-ins.
- `prefers-reduced-motion` turns off the opening, the moving background and parallax.
- The current `intro.tsx` is removed.
