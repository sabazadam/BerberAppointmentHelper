# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` - Start development server (runs on http://localhost:3000)
- `npm test` - Run tests in interactive watch mode
- `npm run build` - Build for production
- `npm run test -- --coverage` - Run tests with coverage report
- `npm run test -- --watchAll=false` - Run tests once without watch mode

## Project Architecture

This is a React-based barber appointment booking system with Firebase backend integration. The application has two main views:

### Customer View
- **Calendar component** (`src/components/Calendar/Calendar.tsx`) - Main scheduling interface
- **BookingModal** (`src/components/BookingModal/BookingModal.tsx`) - Appointment creation form
- **UI components** (`src/components/ui/`) - Reusable modals and form components

### Admin View
- **AdminPanel** (`src/components/AdminPanel/AdminPanel.tsx`) - Management interface for appointments

### State Management
- Main app state is managed in `App.tsx` using React hooks
- Real-time appointment updates via Firebase listeners
- Slot availability tracked via `bookedSlots` and `blockedSlots` state

### Firebase Integration
- **Configuration**: `src/services/firebase.ts` - Firebase app initialization
- **Appointment Service**: `src/services/appointmentService.ts` - CRUD operations for appointments
- **Admin Service**: `src/services/adminService.ts` - Admin-specific operations like blocking slots
- **Test Service**: `src/services/firebaseTest.ts` - Connection testing utilities

### Data Models
- **Types**: `src/types/index.ts` and `src/types/admin.ts`
- **Appointment statuses**: `pending`, `approved`, `rejected`, `cancelled`, `no_show`
- **Service objects**: Include `id`, `name`, `price`, `duration`

### Styling
- **Tailwind CSS** with custom color scheme:
  - `barber-gold`: #D4AF37
  - `barber-dark`: #1a1a1a  
  - `barber-cream`: #F5F5DC
- **Responsive design** with mobile-first approach

### Utilities
- **Date/Time handling**: `src/utils/dateUtils.ts`, `src/utils/timeUtils.ts`
- **Constants**: `src/utils/constants.ts`

### Environment Setup
- Firebase configuration via `.env` file with `REACT_APP_FIREBASE_*` variables
- Firestore security rules defined in `firestore.rules`

### Testing
- Jest + React Testing Library setup
- Test files follow `*.test.tsx` pattern
- Use `@testing-library/react` for component testing