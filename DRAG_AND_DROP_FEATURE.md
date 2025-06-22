# Drag and Drop Reordering Feature

## Overview

The drag-and-drop reordering feature allows salon owners to easily reorder their services and providers. The order set in the dashboard will be reflected on the public booking form, ensuring a consistent experience for clients.

## Features

### Services Page (`/dashboard/settings/services`)
- **Drag and Drop**: Reorder services by dragging the grip handle (⋮⋮) on the left side of each service card
- **Visual Feedback**: Services become semi-transparent while being dragged
- **Auto-save**: Changes are automatically saved to the database
- **Error Handling**: If saving fails, the original order is restored
- **Loading State**: Shows "Saving new order..." while updating

### Providers Page (`/dashboard/settings/providers`)
- **Drag and Drop**: Reorder providers by dragging the grip handle (⋮⋮) on the left side of each provider card
- **Visual Feedback**: Providers become semi-transparent while being dragged
- **Auto-save**: Changes are automatically saved to the database
- **Error Handling**: If saving fails, the original order is restored
- **Loading State**: Shows "Saving new order..." while updating

## Technical Implementation

### Database Changes
- Added `order` field to both `Service` and `Provider` types
- Services and providers are now ordered by the `order` field in ascending order
- New services/providers automatically get the next available order number

### Components
- **DraggableList**: Reusable drag-and-drop component using `@dnd-kit/core`
- **DraggableItem**: Individual draggable item with grip handle
- **Visual Indicators**: Grip handle (⋮⋮) and hover states

### Libraries Used
- `@dnd-kit/core`: Core drag-and-drop functionality
- `@dnd-kit/sortable`: Sortable list functionality
- `@dnd-kit/utilities`: Utility functions for transforms

## User Experience

### How to Use
1. Navigate to Services or Providers page in the dashboard
2. Look for the grip handle (⋮⋮) on the left side of each item
3. Click and drag the grip handle to reorder items
4. Release to drop the item in its new position
5. The new order is automatically saved

### Visual Cues
- **Grip Handle**: Three vertical dots (⋮⋮) indicate draggable items
- **Hover State**: Grip handle changes color on hover
- **Dragging State**: Item becomes semi-transparent while being dragged
- **Loading State**: Blue notification shows when saving changes

## Booking Form Integration

The order set in the dashboard is automatically reflected on the public booking form:
- Services appear in the same order as set in the dashboard
- Providers appear in the same order as set in the dashboard
- No additional configuration needed

## Error Handling

- **Network Errors**: If saving fails, the original order is restored
- **Validation**: Ensures all required fields are filled before saving
- **User Feedback**: Clear error messages and loading states

## Migration

For existing data, a migration script is provided in `scripts/migrate-order-fields.js`:
1. Add your Firebase configuration to the script
2. Run the script to add order fields to existing services and providers
3. Existing items will be ordered by creation date

## Future Enhancements

Potential improvements for the drag-and-drop feature:
- **Bulk Operations**: Select multiple items to reorder together
- **Keyboard Navigation**: Use arrow keys to reorder items
- **Undo/Redo**: Ability to undo reordering changes
- **Drag Between Lists**: Move items between different categories
- **Visual Indicators**: Show drop zones more clearly 