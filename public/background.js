
// Background script for Key Vault Guardian Angel extension
console.log("Key Vault Guardian Angel background script loaded");

// Initialize data storage and context menus
chrome.runtime.onInstalled.addListener(() => {
  console.log("Key Vault Guardian Angel installed!");
  
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
              includeSymbols: true,
              excludeSimilarCharacters: false
            }
          },
          locked: true,
          lastUnlocked: null
        }
      });
    }
  });
  
  // Create context menu for generating passwords
  chrome.contextMenus.create({
    id: "generatePassword",
    title: "Generate Password",
    contexts: ["editable"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generatePassword") {
    // Generate a password and insert it into the field
    const password = generateStrongPassword();
    chrome.tabs.sendMessage(tab.id, {
      action: "fillWithGeneratedPassword",
      password: password
    });
  }
});

// Generate a strong password using crypto API
function generateStrongPassword() {
  // Default settings
  const length = 16;
  const includeUppercase = true;
  const includeLowercase = true;
  const includeNumbers = true;
  const includeSymbols = true;
  
  let chars = '';
  
  const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBER_CHARS = '0123456789';
  const SYMBOL_CHARS = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  if (includeUppercase) chars += UPPERCASE_CHARS;
  if (includeLowercase) chars += LOWERCASE_CHARS;
  if (includeNumbers) chars += NUMBER_CHARS;
  if (includeSymbols) chars += SYMBOL_CHARS;
  
  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  
  return password;
}

// Listen for tab navigation to check for login forms
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Execute a content script to check for login forms
    chrome.scripting.executeScript({
      target: { tabId },
      function: () => {
        // The actual code runs in content.js which is already injected
        chrome.runtime.sendMessage({ action: "checkForLoginForms", url: window.location.hostname });
      }
    }).catch(err => console.error('Error executing script:', err));
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request.action);
  
  // Handle specific actions
  if (request.action === "checkForLoginForms") {
    // This just notifies the background script that we should look for forms on this page
    // No direct action needed here as content script will handle UI interaction
  }
  else if (request.action === "getMatchingCredentials") {
    getMatchingCredentials(request.domain, sendResponse);
    return true; // Keep the message channel open for async response
  }
  else if (request.action === "autofillRequested") {
    handleAutofill(request.url, sender.tab.id);
    return true;
  }
  else if (request.action === "credentialSubmitted") {
    saveDetectedCredential(request.data);
    return true;
  }
  else if (request.action === "credentialUsed") {
    updateCredentialLastUsed(request.credentialId);
    return true;
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
      try {
        const credUrl = new URL(cred.url);
        return credUrl.hostname === domain || 
               credUrl.hostname.endsWith('.' + domain) ||
               domain.endsWith('.' + credUrl.hostname);
      } catch (e) {
        // If URL is invalid, do a simple includes check
        return cred.url.includes(domain);
      }
    });
    
    sendResponse({ credentials: matchingCredentials, locked: false });
  });
}

// Update the last used timestamp for a credential
function updateCredentialLastUsed(credentialId) {
  chrome.storage.local.get('vault', ({ vault }) => {
    if (!vault || vault.locked) return;
    
    const updatedCredentials = vault.credentials.map(cred => {
      if (cred.id === credentialId) {
        return { ...cred, lastUsed: new Date().toISOString() };
      }
      return cred;
    });
    
    chrome.storage.local.set({
      vault: {
        ...vault,
        credentials: updatedCredentials
      }
    });
  });
}

// Handle autofill requests
function handleAutofill(url, tabId) {
  chrome.storage.local.get('vault', ({ vault }) => {
    if (!vault || vault.locked) {
      // Show notification that vault is locked
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Vault Locked',
        message: 'Please unlock your vault to autofill credentials.'
      });
      return;
    }
    
    // Find matching credentials
    const matchingCredentials = vault.credentials.filter(cred => {
      try {
        const credUrl = new URL(cred.url);
        return credUrl.hostname === url || 
               credUrl.hostname.endsWith('.' + url) ||
               url.endsWith('.' + credUrl.hostname);
      } catch (e) {
        return cred.url.includes(url);
      }
    });
    
    if (matchingCredentials.length > 0) {
      // If we have exactly one credential, autofill it
      if (matchingCredentials.length === 1) {
        chrome.tabs.sendMessage(tabId, {
          action: "fillLoginForm",
          credential: matchingCredentials[0]
        });
      } 
      // If we have multiple credentials, show a selection popup
      else {
        chrome.tabs.sendMessage(tabId, {
          action: "showCredentialSelector",
          credentials: matchingCredentials
        });
      }
    } else {
      // No credentials found
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'No Credentials Found',
        message: `No saved credentials found for ${url}.`
      });
    }
  });
}

// Save a newly detected credential
function saveDetectedCredential(data) {
  chrome.storage.local.get('vault', ({ vault }) => {
    if (!vault || vault.locked) return;
    
    // Check if this credential already exists
    const existingCredIndex = vault.credentials.findIndex(cred => {
      try {
        const credUrl = new URL(cred.url);
        const dataUrl = new URL(data.url);
        return credUrl.hostname === dataUrl.hostname && cred.username === data.username;
      } catch (e) {
        return cred.url === data.url && cred.username === data.username;
      }
    });
    
    // If credential exists, ask if user wants to update
    if (existingCredIndex >= 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Update Credential?',
        message: `Would you like to update the password for ${data.username} on ${data.domain}?`,
        buttons: [
          { title: 'Update' },
          { title: 'Cancel' }
        ],
        requireInteraction: true
      });
      
      // Store the data temporarily to use it when the user responds
      chrome.storage.local.set({ tempCredential: data });
    } else {
      // If credential is new, ask if user wants to save it
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Save Credential?',
        message: `Would you like to save the password for ${data.username} on ${data.domain}?`,
        buttons: [
          { title: 'Save' },
          { title: 'Cancel' }
        ],
        requireInteraction: true
      });
      
      // Store the data temporarily
      chrome.storage.local.set({ tempCredential: data });
    }
  });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  chrome.storage.local.get(['vault', 'tempCredential'], (result) => {
    if (!result.vault || !result.tempCredential) return;
    
    // Button index 0 = Save/Update, 1 = Cancel
    if (buttonIndex === 0) {
      const data = result.tempCredential;
      const existingCredIndex = result.vault.credentials.findIndex(cred => {
        try {
          const credUrl = new URL(cred.url);
          const dataUrl = new URL(data.url);
          return credUrl.hostname === dataUrl.hostname && cred.username === data.username;
        } catch (e) {
          return cred.url === data.url && cred.username === data.username;
        }
      });
      
      const now = new Date().toISOString();
      
      // Update existing credential
      if (existingCredIndex >= 0) {
        const updatedCredentials = [...result.vault.credentials];
        updatedCredentials[existingCredIndex] = {
          ...updatedCredentials[existingCredIndex],
          password: data.password,
          updatedAt: now
        };
        
        chrome.storage.local.set({
          vault: {
            ...result.vault,
            credentials: updatedCredentials
          },
          tempCredential: null
        });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Credential Updated',
          message: `Password updated for ${data.username} on ${data.domain}.`
        });
      } 
      // Save new credential
      else {
        const newCredential = {
          id: generateUUID(),
          title: data.title,
          url: data.url,
          username: data.username,
          password: data.password,
          notes: '',
          favorite: false,
          createdAt: now,
          updatedAt: now
        };
        
        chrome.storage.local.set({
          vault: {
            ...result.vault,
            credentials: [...result.vault.credentials, newCredential]
          },
          tempCredential: null
        });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Credential Saved',
          message: `Password saved for ${data.username} on ${data.domain}.`
        });
      }
    } else {
      // User clicked Cancel
      chrome.storage.local.set({ tempCredential: null });
    }
  });
});

// Helper function to generate UUIDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Set up auto-lock timer
let lockTimeoutId = null;

function setupAutoLock() {
  chrome.storage.local.get('vault', ({ vault }) => {
    if (!vault) return;
    
    // Clear existing timeout if any
    if (lockTimeoutId) {
      clearTimeout(lockTimeoutId);
    }
    
    // If vault is unlocked, set up a new timeout
    if (!vault.locked) {
      const lockTimeoutMinutes = vault.settings.lockTimeout || 15;
      lockTimeoutId = setTimeout(() => {
        lockVault();
      }, lockTimeoutMinutes * 60 * 1000);
    }
  });
}

function lockVault() {
  chrome.storage.local.get('vault', ({ vault }) => {
    if (!vault) return;
    
    chrome.storage.local.set({
      vault: {
        ...vault,
        locked: true,
        lastUnlocked: null
      }
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Vault Locked',
      message: 'Your vault has been automatically locked for security.'
    });
  });
}

// Listen for user activity to reset the auto-lock timer
chrome.tabs.onActivated.addListener(() => {
  setupAutoLock();
});
