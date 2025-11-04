const TOKEN_KEY = 'authToken';
const LOCAL_STORAGE_KEY = 'aiTaskGeneratorPreferences';

export const saveToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token to local storage:', error);
  }
};

export const loadToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error loading token from local storage:', error);
    return null;
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from local storage:', error);
  }
};

export const savePreferences = (preferences) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences to local storage:', error);
  }
};

export const loadPreferences = () => {
  try {
    const preferences = localStorage.getItem(LOCAL_STORAGE_KEY);
    return preferences ? JSON.parse(preferences) : {};
  } catch (error) {
    console.error('Error loading preferences from local storage:', error);
    return {};
  }
};
