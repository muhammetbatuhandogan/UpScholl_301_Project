# Design System (Initial Draft)

This document defines the baseline design system for upcoming CRUD + live UI work.

## 1) Design Principles
- Clarity first: emergency context requires simple and obvious UI.
- Fast scanning: users should understand status in under 3 seconds.
- Consistency: reusable components and spacing scale across screens.
- Safety emphasis: critical actions (SOS, warnings) are visually distinct.
- Accessibility by default: readable contrast, touch-friendly controls.

## 2) Color Tokens
- `--color-bg`: `#F9FAFB`
- `--color-surface`: `#FFFFFF`
- `--color-text-primary`: `#111827`
- `--color-text-secondary`: `#4B5563`
- `--color-border`: `#E5E7EB`
- `--color-primary`: `#2563EB`
- `--color-success`: `#16A34A`
- `--color-warning`: `#D97706`
- `--color-danger`: `#DC2626`

Score colors:
- Low (0-40): `#DC2626`
- Medium (41-70): `#D97706`
- High (71-100): `#16A34A`

## 3) Typography
- Font family: system sans stack (Arial/Inter equivalent).
- Heading sizes:
  - H1: 32px / 700
  - H2: 24px / 700
  - H3: 20px / 600
- Body:
  - Regular: 16px / 400
  - Secondary: 14px / 400
- Small labels/captions: 12px / 500

## 4) Spacing and Radius
- Spacing scale: `4, 8, 12, 16, 24, 32`.
- Card padding: `16px` (mobile), `24px` (desktop).
- Border radius:
  - Small: `8px`
  - Medium: `12px`
  - Large: `16px`

## 5) Core Components (v1)
- `AppShell`: page container + top section.
- `StatusCard`: score, health, and summary cards.
- `TaskList`: list wrapper for CRUD tasks.
- `TaskItem`: single task row (title, status, actions).
- `PrimaryButton`: main action.
- `DangerButton`: destructive actions.
- `InputField`: text input with label + validation message.
- `Badge`: status label (`todo`, `in-progress`, `done`).
- `Toast`: success/error feedback.

## 6) CRUD Screen Layout (First Target)
- Top: app title + backend connection badge.
- Left/Main:
  - task creation form
  - task list
- Right/Below:
  - summary cards (total, completed, pending)
  - basic activity log/last update

## 7) Interaction Rules
- Every network request has visible state:
  - loading
  - success
  - error
- Buttons disabled during in-flight mutation.
- Delete action asks for explicit confirmation.
- Optimistic update can be used only if rollback path is implemented.

## 8) API State Conventions
- List loading: skeleton rows or loader text.
- Empty state: friendly message + CTA to create first item.
- Error state: short explanation + retry button.
- Mutation result: toast feedback.

## 9) Accessibility Baseline
- Color contrast minimum AA for text/action controls.
- Keyboard focus visible for all interactive elements.
- Touch target minimum: 40x40 px.
- Buttons/inputs use explicit labels (no placeholder-only labeling).

## 10) File Conventions for UI
- `frontend/src/components/common/*` for reusable primitives.
- `frontend/src/components/tasks/*` for task module views.
- `frontend/src/styles.css` keeps global tokens.
- Component-specific styling can be colocated when complexity grows.

## 11) Immediate UI Milestone
- Build a non-white, usable dashboard view.
- Implement full task CRUD flow.
- Ensure responsive layout and consistent token usage.
