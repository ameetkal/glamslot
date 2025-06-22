'use client'

import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface DraggableItemProps {
  id: string
  children: React.ReactNode
  className?: string
}

const DraggableItem: React.FC<DraggableItemProps> = ({ id, children, className = '' }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center">
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mr-2"
        >
          <Bars3Icon className="h-4 w-4" />
        </button>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

interface DraggableListProps<T> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T) => React.ReactNode
  getItemId: (item: T) => string
  className?: string
  itemClassName?: string
}

export default function DraggableList<T>({
  items,
  onReorder,
  renderItem,
  getItemId,
  className = '',
  itemClassName = '',
}: DraggableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(item => getItemId(item) === active.id)
      const newIndex = items.findIndex(item => getItemId(item) === over?.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      onReorder(newItems)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(getItemId)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item) => (
            <DraggableItem
              key={getItemId(item)}
              id={getItemId(item)}
              className={itemClassName}
            >
              {renderItem(item)}
            </DraggableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
} 