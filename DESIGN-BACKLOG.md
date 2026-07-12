# CATPrep Design Backlog

This backlog contains the "This Week" and "Later" design polish items identified during the Design Audit. These items were deliberately deferred to ensure core functionality and critical visual updates were prioritized.

## This Week (Medium Priority)
- **Empty / Logged-Out States**: Redesign the empty states across the app (especially in Performance and Mock Tests) to be more welcoming and informative, encouraging the user to take their first action.
- **Login Screen Refinement**: Increase contrast and padding on the login screen, especially for the left-hand panel on desktop and the mobile view.
- **Focus States**: Add explicit keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2`) to all interactive elements for better accessibility.

## This Month (Low Priority / High Polish)
- **Framer Motion Transitions**: Introduce subtle page transitions (e.g., a 150ms ease fade-in-up) when navigating between major sections (Dashboard -> Mocks -> Analytics) to make the SPA feel fluid.
- **Dark Mode Calibration**: The current dark mode relies heavily on default `slate-900` / `slate-950`. Calibrate exact hex colors to ensure optimal contrast and a truly premium "night mode" feel (e.g., `#0f1115`).

## Later (Nice to Have)
- **Custom Illustration System**: Replace generic icons in empty states with a custom illustration style (perhaps featuring the Fleabag "Cat" mascot) to reinforce the brand personality.
- **Achievement Badges**: Design bespoke SVGs or CSS art for the different "Warrior Ranks" (Novice, Aspirant, Challenger, Warrior, Legend) to make ranking up feel like a true milestone.
