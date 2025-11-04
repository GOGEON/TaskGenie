import React from 'react';
import { useDragLayer } from 'react-dnd';
import ToDoItem from './ToDoItem';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles(initialOffset, currentOffset) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }
  let { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

const CustomDragLayer = () => {
  const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging) {
    return null;
  }

  function renderItem() {
    switch (itemType) {
      case 'TODO_ITEM':
        return (
          <ToDoItem
            item={item}
            isPreview={true}
            index={item.index}
            moveItem={() => {}}
            onToggleItemComplete={() => {}}
            onOpenContextMenu={() => {}}
            onGenerateSubtasks={() => {}}
            onEditItem={() => {}}
            onDeleteItem={() => {}}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialOffset, currentOffset)}>
        {renderItem()}
      </div>
    </div>
  );
};

export default CustomDragLayer;
