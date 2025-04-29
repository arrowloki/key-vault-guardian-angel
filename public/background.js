
// Background script for Key Vault Guardian Angel extension

// Initialize data storage
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
              includeSymbols: true
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
    const password = generateRandomPassword();
    chrome.tabs.sendMessage(tab.id, {
      action: "fillWithGeneratedPassword",
      password: password
    });
  }
});

// Generate a random password (simplified version)
function generateRandomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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
    const url = new URL(window.location.href);
    chrome.runtime.sendMessage({ 
      action: "loginFormDetected", 
      url: url.hostname,
      formCount: passwordFields.length
    });
    
    // Add a small badge to the password fields
    passwordFields.forEach(field => {
      // Create the badge element
      const badge = document.createElement('div');
      badge.className = 'keyvault-badge';
      badge.style.position = 'absolute';
      badge.style.right = '10px';
      badge.style.top = '50%';
      badge.style.transform = 'translateY(-50%)';
      badge.style.zIndex = '9999';
      badge.style.cursor = 'pointer';
      badge.style.width = '20px';
      badge.style.height = '20px';
      badge.style.borderRadius = '50%';
      badge.style.backgroundColor = '#6e59a5';
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
      badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M19 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2z"></path><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
      
      // Position the badge properly
      const fieldRect = field.getBoundingClientRect();
      const fieldStyle = window.getComputedStyle(field);
      field.style.paddingRight = '30px';
      
      // Set up container for positioning
      const container = document.createElement('div');
      container.style.position = 'relative';
      
      // Insert the badge
      field.parentNode.insertBefore(container, field);
      container.appendChild(field);
      container.appendChild(badge);
      
      // Add click handler to the badge
      badge.addEventListener('click', function() {
        chrome.runtime.sendMessage({ 
          action: "autofillRequested", 
          url: window.location.hostname 
        });
      });
    });
  }
}

// Listen for form submissions to capture credentials
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    chrome.scripting.executeScript({
      target: { tabId },
      function: detectFormSubmissions
    });
  }
});

function detectFormSubmissions() {
  document.querySelectorAll('form').forEach(form => {
    const passwordField = form.querySelector('input[type="password"]');
    if (passwordField) {
      form.addEventListener('submit', function() {
        const usernameField = form.querySelector('input[type="text"], input[type="email"]');
        if (usernameField && passwordField.value) {
          chrome.runtime.sendMessage({
            action: "credentialSubmitted",
            data: {
              url: window.location.href,
              domain: window.location.hostname,
              username: usernameField.value,
              password: passwordField.value,
              title: document.title || window.location.hostname
            }
          });
        }
      });
    }
  });
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle specific actions
  if (request.action === "getMatchingCredentials") {
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
      
      // Update last used timestamp
      const updatedCredentials = vault.credentials.map(cred => {
        if (matchingCredentials.find(mc => mc.id === cred.id)) {
          return { ...cred, lastUsed: new Date() };
        }
        return cred;
      });
      
      chrome.storage.local.set({
        vault: {
          ...vault,
          credentials: updatedCredentials
        }
      });
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
      
      const now = new Date();
      
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
