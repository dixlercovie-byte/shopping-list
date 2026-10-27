chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save selection to Quick Notes',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-selection') return;
  const { notes = [] } = await chrome.storage.local.get('notes');
  notes.unshift({
    id: crypto.randomUUID(),
    text: info.selectionText,
    url: tab?.url || '',
    title: tab?.title || '',
    updated: Date.now(),
  });
  await chrome.storage.local.set({ notes });
});
