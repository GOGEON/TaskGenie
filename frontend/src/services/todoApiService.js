import api from './api';

export const getToDos = async () => {
  const response = await api.get('/todos');
  return response.data;
};

export const generateToDoList = async (keyword) => {
  const response = await api.post('/todos/generate', { keyword });
  return response.data;
};

export const generateSubtasks = async (itemId) => {
  const response = await api.post(`/todos/items/${itemId}/generate-subtasks`);
  return response.data;
};

export const updateToDoList = async (listId, updateData) => {
  // updateData can be { keyword, color, icon }
  const response = await api.put(`/todos/${listId}`, updateData);
  return response.data;
};

export const updateToDoItem = async (itemId, updateData) => {
  // updateData can be { description, is_completed, order }
  const response = await api.put(`/todos/items/${itemId}`, updateData);
  return response.data;
};

export const deleteToDoItem = async (itemId) => {
  await api.delete(`/todos/items/${itemId}`);
};

export const deleteToDoList = async (listId) => {
  const response = await api.delete(`/todos/${listId}`);
  return response.data;
};
