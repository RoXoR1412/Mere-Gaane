// Maximum number of search history items to store
const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = 'mere-gaane-search-history';

// Get search history from local storage
export const getSearchHistory = (): any[] => {
  try {
    const historyString = localStorage.getItem(STORAGE_KEY);
    if (!historyString) return [];
    return JSON.parse(historyString);
  } catch (error) {
    console.error('Error retrieving search history:', error);
    return [];
  }
};

// Add a new item to search history
export const addToSearchHistory = (item: any): void => {
  try {
    // Don't add if the item doesn't have required fields
    if (!item || !item.id || !item.title) return;

    const history = getSearchHistory();
    
    // Check if item already exists in history
    const existingIndex = history.findIndex(historyItem => historyItem.id === item.id);
    
    // If item exists, remove it (we'll add it to the beginning)
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }
    
    // Add item to the beginning of the array
    history.unshift(item);
    
    // Limit the history to MAX_HISTORY_ITEMS
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    // Save to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
};

// Clear search history
export const clearSearchHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}; 