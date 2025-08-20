# AI Features System Guide

## Overview
The EduLeadPro application now has a scalable AI features system that allows easy addition and management of AI-powered features through a centralized configuration.

## Architecture

### 1. Configuration File
**Location**: `client/src/config/aiFeatures.ts`

This file contains:
- `AIFeature` interface definition
- `aiFeatures` array with all AI features
- Helper functions for filtering and managing features

### 2. Sidebar Integration
**Location**: `client/src/components/layout/sidebar.tsx`

The sidebar automatically:
- Displays active AI features in a collapsible section
- Shows "Coming Soon" features with disabled state
- Auto-expands when user navigates to an AI feature
- Maintains consistent styling with the application theme

### 3. Theme Consistency
All AI features now follow the application's dark theme:
- Background: `bg-black` for main containers
- Cards: `bg-[#62656e]` for primary cards, `bg-[#4a4d56]` for secondary cards
- Text: `text-white` for primary text, `text-gray-300` for secondary text
- Accent colors: Purple (`text-purple-400`), Blue (`text-blue-400`), Green (`text-green-400`), etc.

## Adding New AI Features

### Step 1: Add Feature Configuration
Edit `client/src/config/aiFeatures.ts`:

```typescript
{
  id: 'ai-new-feature',
  name: 'AI New Feature',
  href: '/ai-new-feature',
  icon: YourIcon, // Import from lucide-react
  description: 'Description of your feature',
  category: 'analytics', // 'analytics' | 'automation' | 'prediction' | 'communication'
  isActive: true, // Set to false for coming soon features
  comingSoon: false, // Set to true for coming soon features
}
```

### Step 2: Create the Feature Page
Create your page component in `client/src/pages/`:

```typescript
// Example: ai-new-feature.tsx
export default function AINewFeature() {
  return (
    <div className="min-h-screen w-full bg-black text-white px-4">
      {/* Your feature content */}
    </div>
  );
}
```

### Step 3: Add Route
Add the route in `client/src/App.tsx`:

```typescript
<Route path="/ai-new-feature">
  {() => (
    <ProtectedRoute component={() => (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <AINewFeature />
        </div>
      </div>
    )} />
  )}
</Route>
```

### Step 4: Follow Theme Guidelines
Use these consistent styling patterns:

#### Main Container
```typescript
<div className="min-h-screen w-full bg-black text-white px-4">
```

#### Headers
```typescript
<h1 className="text-3xl font-bold flex items-center gap-2 text-white">
  <YourIcon className="h-8 w-8 text-purple-400" />
  Your Feature Name
</h1>
<p className="text-gray-300 mt-2">Feature description</p>
```

#### Cards
```typescript
// Primary cards
<Card className="bg-[#62656e] text-white border-none shadow-lg">

// Secondary cards
<Card className="bg-[#4a4d56] text-white border-none">

// Card titles
<CardTitle className="text-white">Title</CardTitle>

// Card descriptions
<CardDescription className="text-gray-300">Description</CardDescription>
```

#### Buttons
```typescript
<Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800">
  Button Text
</Button>
```

#### Tabs
```typescript
<TabsList className="bg-[#62656e] border-none">
  <TabsTrigger className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">
    Tab Name
  </TabsTrigger>
</TabsList>
```

## Feature Categories

### Analytics
Features that provide insights and data analysis
- Examples: AI Control Center, Performance Analytics

### Automation
Features that automate processes
- Examples: AI Marketing, Automated Workflows

### Prediction
Features that provide predictive capabilities
- Examples: AI Forecasting, Student Success Prediction

### Communication
Features that handle communication and interaction
- Examples: Virtual Assistant, Chatbots

## Helper Functions

### `getActiveAIFeatures()`
Returns only features where `isActive: true`

### `getAIFeaturesByCategory(category)`
Returns features filtered by category

### `getComingSoonFeatures()`
Returns features marked as coming soon

### `isAIFeaturePath(path)`
Checks if a given path belongs to an AI feature

## Best Practices

1. **Consistent Naming**: Use descriptive, consistent naming for feature IDs and routes
2. **Icon Selection**: Choose appropriate icons from lucide-react that represent the feature
3. **Category Assignment**: Assign features to appropriate categories for better organization
4. **Theme Compliance**: Always follow the established dark theme patterns
5. **Responsive Design**: Ensure features work well on different screen sizes
6. **Loading States**: Include proper loading states for async operations
7. **Error Handling**: Implement proper error handling and user feedback

## Future Enhancements

The system is designed to support:
- Feature permissions and role-based access
- Feature flags for A/B testing
- Analytics tracking for feature usage
- Dynamic feature loading
- Feature-specific settings and configurations

## Troubleshooting

### Feature Not Showing in Sidebar
1. Check if `isActive: true` in the configuration
2. Verify the feature is properly imported in the config file
3. Ensure the icon is imported from lucide-react

### Theme Issues
1. Verify you're using the correct CSS classes
2. Check that all cards have the proper background colors
3. Ensure text colors are appropriate for dark theme

### Route Issues
1. Confirm the route is added to App.tsx
2. Check that the href in the config matches the route path
3. Verify the component is properly imported