chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // Get the active tab and open side panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  }
});