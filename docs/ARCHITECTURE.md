# Project Architecture

This document provides an overview of the InvestAI Assistant architecture and design decisions.

## Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── ai-guidance/    # AI chat and guidance components
│   ├── market-analysis/# Market analysis and chart components
│   ├── portfolio/      # Portfolio management components
│   └── ui/            # Base UI components (shadcn/ui)
├── contexts/           # React context providers
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and configurations
├── pages/             # Application pages/routes
└── types/             # TypeScript type definitions
```

## Key Design Decisions

### Authentication & User Management
- Firebase Authentication for user management
- Custom AuthContext for state management
- Cloudinary for profile picture storage

### State Management
- React Context API for global state
- TanStack Query for server state management
- Local state for component-specific data

### Data Flow
1. User actions trigger component handlers
2. Handlers interact with contexts or API calls
3. State updates trigger re-renders
4. UI reflects updated state

### Component Architecture
- Small, focused components
- Container/Presenter pattern where applicable
- Shared UI components in ui/ directory
- Feature-specific components in feature directories

### Styling
- Tailwind CSS for utility-first styling
- shadcn/ui for pre-built components
- Custom theme context for dark/light mode

### Error Handling
- Error boundaries for component-level errors
- Toast notifications for user feedback
- Console logging for development

### Performance Considerations
- Code splitting by route
- Lazy loading of components
- Memoization of expensive calculations
- Optimized re-renders using React.memo

## Future Considerations

- Implementation of WebSocket for real-time data
- Integration with additional data providers
- Enhanced caching strategies
- Mobile-first responsive design improvements