
// Background script for Key Vault Guardian Angel extension

// Initialize data storage
chrome.runtime.onInstalled.addListener(() => {
  // Create initial vault structure
  chrome.storage.local.get('vault', (result) => {
    if (!result.vault) {
      chrome.storage.local.set({
        vault: {
          credentials: [],
          secureNotes: [],
          paymentCards: [],
          settings: {
            lockTimeout: 15, // minutes
            passwordGenerator: {
              length: 16,
              includeUppercase: true,
              includeLowercase: true,
              includeNumbers: true,
              includeSymbols: true
            }
          },
          locked: true,
          lastUnlocked: null
        }
      });
    }
  });
});

// Listen for tab changes to check for login forms
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId },
      function: checkForLoginForms
    });
  }
});

// Function to check if the current page has login forms
function checkForLoginForms() {
  // Look for password fields on the page
  const passwordFields = document.querySelectorAll('input[type="password"]');
  
  // If we found at least one password field, notify the extension
  if (passwordFields.length > 0) {
    chrome.runtime.sendMessage({ action: "loginFormDetected", url: window.location.hostname });
  }
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle specific actions
  if (request.action === "getMatchingCredentials") {
    getMatchingCredentials(request.domain, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Function to find credentials that match the current domain
function getMatchingCredentials(domain, sendResponse) {
  chrome.storage.local.get('vault', ({ vault }) => {
    if (!vault || vault.locked) {
      sendResponse({ credentials: [], locked: true });
      return;
    }
    
    // Filter credentials by domain
    const matchingCredentials = vault.credentials.filter(cred => {
      return new URL(cred.url).hostname === domain;
    });
    
    sendResponse({ credentials: matchingCredentials, locked: false });
  });
}
