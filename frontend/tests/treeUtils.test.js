import { describe, it, expect } from 'vitest';
import {
  findItem,
  patchItem,
  replaceItem,
  removeItem,
  moveSibling,
  setItemCompletion,
  syncParentCompletion,
  sortByCompletion,
  reassignOrder,
  flattenItems,
  diffCompletion,
} from '../src/utils/treeUtils';

const tree = () => [
  {
    id: 'a', order: 0, is_completed: false, description: 'A',
    children: [
      { id: 'a1', order: 0, is_completed: false, children: [] },
      { id: 'a2', order: 1, is_completed: false, children: [] },
    ],
  },
  { id: 'b', order: 1, is_completed: false, children: [] },
];

describe('treeUtils', () => {
  it('findItem finds nested items and returns null when missing', () => {
    expect(findItem(tree(), 'a2').id).toBe('a2');
    expect(findItem(tree(), 'zzz')).toBeNull();
  });

  it('patchItem updates only the target without mutating input', () => {
    const items = tree();
    const result = patchItem(items, 'a1', { priority: 'high' });
    expect(findItem(result, 'a1').priority).toBe('high');
    expect(findItem(items, 'a1').priority).toBeUndefined();
    expect(result[1]).toBe(items[1]);
  });

  it('replaceItem swaps the whole item', () => {
    const result = replaceItem(tree(), { id: 'b', order: 1, children: [{ id: 'b1' }] });
    expect(findItem(result, 'b1')).toEqual({ id: 'b1' });
  });

  it('removeItem removes item with its children', () => {
    const result = removeItem(tree(), 'a');
    expect(result.map(i => i.id)).toEqual(['b']);
    expect(removeItem(tree(), 'a1')[0].children.map(i => i.id)).toEqual(['a2']);
  });

  it('moveSibling reorders top level and nested children', () => {
    expect(moveSibling(tree(), null, 0, 1).map(i => i.id)).toEqual(['b', 'a']);
    expect(moveSibling(tree(), 'a', 1, 0)[0].children.map(i => i.id)).toEqual(['a2', 'a1']);
  });

  it('setItemCompletion cascades to children', () => {
    const result = setItemCompletion(tree(), 'a', true);
    expect(flattenItems(result).filter(i => i.is_completed).map(i => i.id)).toEqual(['a', 'a1', 'a2']);
  });

  it('syncParentCompletion marks parent complete only when all children are', () => {
    let items = setItemCompletion(tree(), 'a1', true);
    expect(syncParentCompletion(items)[0].is_completed).toBe(false);
    items = setItemCompletion(items, 'a2', true);
    expect(syncParentCompletion(items)[0].is_completed).toBe(true);
  });

  it('syncParentCompletion propagates through multiple levels', () => {
    const items = [{
      id: 'p', is_completed: false,
      children: [{ id: 'c', is_completed: false, children: [{ id: 'g', is_completed: true, children: [] }] }],
    }];
    const result = syncParentCompletion(items);
    expect(result[0].is_completed).toBe(true);
    expect(result[0].children[0].is_completed).toBe(true);
  });

  it('sortByCompletion moves completed items down at every level without mutating', () => {
    const items = setItemCompletion(tree(), 'a1', true);
    const result = sortByCompletion(setItemCompletion(items, 'a', true));
    expect(result.map(i => i.id)).toEqual(['b', 'a']);
    expect(items.map(i => i.id)).toEqual(['a', 'b']);
  });

  it('reassignOrder sets order from position recursively', () => {
    const result = reassignOrder(moveSibling(tree(), 'a', 1, 0));
    expect(result[0].children.map(i => [i.id, i.order])).toEqual([['a2', 0], ['a1', 1]]);
  });

  it('diffCompletion lists items whose completion changed', () => {
    const before = tree();
    const after = syncParentCompletion(setItemCompletion(setItemCompletion(before, 'a1', true), 'a2', true));
    expect(diffCompletion(before, after).map(i => i.id).sort()).toEqual(['a', 'a1', 'a2']);
  });
});
