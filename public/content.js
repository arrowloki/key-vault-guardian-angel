
// Content script for Key Vault Guardian Angel
console.log("Key Vault Guardian Angel content script loaded");

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeContentScript();
});

// Also try to initialize immediately (for pages that might be already loaded)
initializeContentScript();

function initializeContentScript() {
  // Add CSS for the badge and credential selector
  injectStyles();
  
  // Detect login forms and add badges to password fields
  setupPasswordFieldBadges();
  
  // Set up listeners for form submissions
  setupFormSubmissionListeners();
  
  // Setup mutation observer to detect dynamically added forms
  setupDynamicFormDetection();
}

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .keyvault-badge {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #6e59a5;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .keyvault-badge:hover {
      background-color: #8b5cf6;
      transform: translateY(-50%) scale(1.1);
    }
    .keyvault-badge svg {
      width: 12px;
      height: 12px;
    }
    .keyvault-credential-selector {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
    }
    .keyvault-credential-content {
      background-color: #fff;
      border-radius: 8px;
      padding: 20px;
      max-width: 400px;
      width: 100%;
      max-height: 80vh;
      overflow: auto;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
    .keyvault-credential-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .keyvault-credential-title {
      margin: 0;
      font-size: 18px;
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .keyvault-close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }
    .keyvault-credential-item {
      padding: 12px;
      margin: 8px 0;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid #e0e0e0;
      transition: background-color 0.2s;
    }
    .keyvault-credential-item:hover {
      background-color: #f5f5f5;
    }
    .keyvault-credential-item-title {
      font-weight: bold;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .keyvault-credential-item-username {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .keyvault-no-credentials {
      padding: 15px;
      text-align: center;
      color: #666;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  `;
  document.head.appendChild(style);
}

function setupPasswordFieldBadges() {
  // Find all password fields
  const passwordFields = document.querySelectorAll('input[type="password"]');
  
  if (passwordFields.length === 0) {
    // No password fields found yet, try again later (for dynamic pages)
    setTimeout(setupPasswordFieldBadges, 1000);
    return;
  }

  console.log(`Key Vault found ${passwordFields.length} password fields`);
  
  // Add badges to password fields
  passwordFields.forEach(field => {
    addBadgeToPasswordField(field);
  });
}

function addBadgeToPasswordField(field) {
  // Check if badge already exists for this field
  const existingBadge = field.parentElement?.querySelector('.keyvault-badge');
  if (existingBadge) return;
  
  // Make sure the field's container is position relative
  const fieldStyle = window.getComputedStyle(field);
  const fieldPosition = fieldStyle.position;
  
  // Create a wrapper if needed
  let wrapper = field.parentElement;
  if (!wrapper || (fieldPosition !== 'relative' && fieldPosition !== 'absolute')) {
    // Create a container for positioning
    wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = field.offsetWidth ? field.offsetWidth + 'px' : '100%';
    
    // Insert the wrapper
    field.parentNode.insertBefore(wrapper, field);
    wrapper.appendChild(field);
  }
  
  // Add padding to the field to make room for the badge
  const currentPaddingRight = parseInt(fieldStyle.paddingRight) || 0;
  field.style.paddingRight = (currentPaddingRight + 30) + 'px';
  
  // Create the badge element
  const badge = document.createElement('div');
  badge.className = 'keyvault-badge';
  badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M19 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2z"></path><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
  
  // Add click handler to the badge
  badge.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Request credentials from the extension
    chrome.runtime.sendMessage({ 
      action: "autofillRequested", 
      url: window.location.hostname 
    });
  });
  
  // Append the badge to the wrapper
  wrapper.appendChild(badge);
}

function setupFormSubmissionListeners() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    if (form.querySelector('input[type="password"]')) {
      form.addEventListener('submit', captureSubmittedCredentials);
    }
  });
}

function captureSubmittedCredentials(e) {
  const form = e.target;
  const passwordField = form.querySelector('input[type="password"]');
  const usernameField = findUsernameField(form, passwordField);
  
  if (passwordField && usernameField && passwordField.value) {
    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'credentialSubmitted',
      data: {
        url: window.location.href,
        domain: window.location.hostname,
        username: usernameField.value,
        password: passwordField.value,
        title: document.title || window.location.hostname
      }
    });
  }
}

function findUsernameField(form, passwordField) {
  // Common username field types and attributes
  const usernameSelectors = [
    'input[type="text"][name*="user"]',
    'input[type="text"][name*="email"]',
    'input[type="text"][id*="user"]', 
    'input[type="text"][id*="email"]',
    'input[type="email"]',
    'input[autocomplete="username"]',
    'input[type="text"]',  // Fallback to any text field
    'input:not([type="password"])'  // Last resort: any non-password input
  ];
  
  // Try to find username field in form
  let usernameField = null;
  for (const selector of usernameSelectors) {
    const fields = form.querySelectorAll(selector);
    for (const field of fields) {
      // Skip hidden fields
      if (field.type === 'hidden') continue;
      
      // Skip fields after the password field
      if (field.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_PRECEDING) continue;
      
      usernameField = field;
      break;
    }
    if (usernameField) break;
  }
  
  return usernameField;
}

function setupDynamicFormDetection() {
  // Create a MutationObserver to watch for dynamically added forms and password fields
  const observer = new MutationObserver(mutations => {
    let shouldCheckForPasswordFields = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          // Check if the added node is or contains a form or input
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'FORM' || 
                element.tagName === 'INPUT' ||
                element.querySelector('form') ||
                element.querySelector('input[type="password"]')) {
              shouldCheckForPasswordFields = true;
            }
          }
        });
      }
    }
    
    if (shouldCheckForPasswordFields) {
      // Delay slightly to ensure the DOM is updated
      setTimeout(() => {
        setupPasswordFieldBadges();
        setupFormSubmissionListeners();
      }, 500);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Create and inject the credential selector modal
function createCredentialSelector() {
  // Remove any existing modal
  const existingModal = document.getElementById('keyvault-credential-selector');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'keyvault-credential-selector';
  modal.className = 'keyvault-credential-selector';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'keyvault-credential-content';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'keyvault-credential-header';
  
  const title = document.createElement('h2');
  title.className = 'keyvault-credential-title';
  title.textContent = 'Choose a credential';
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'keyvault-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = () => modal.remove();
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Create credential list container
  const credentialList = document.createElement('div');
  credentialList.id = 'keyvault-credential-list';
  
  // Add elements to DOM
  modalContent.appendChild(header);
  modalContent.appendChild(credentialList);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close when clicking outside the modal
  modal.addEventListener('click', function(e) {
    if (e.target === this) {
      modal.remove();
    }
  });
}

// Populate credential selector with options
function populateCredentialSelector(credentials) {
  const credentialList = document.getElementById('keyvault-credential-list');
  if (!credentialList) return;
  
  credentialList.innerHTML = '';
  
  if (credentials.length === 0) {
    const noCredentials = document.createElement('p');
    noCredentials.className = 'keyvault-no-credentials';
    noCredentials.textContent = 'No credentials found for this site.';
    credentialList.appendChild(noCredentials);
    return;
  }
  
  credentials.forEach(cred => {
    const credItem = document.createElement('div');
    credItem.className = 'keyvault-credential-item';
    
    const credTitle = document.createElement('div');
    credTitle.className = 'keyvault-credential-item-title';
    credTitle.textContent = cred.title || 'Untitled';
    
    const credUsername = document.createElement('div');
    credUsername.className = 'keyvault-credential-item-username';
    credUsername.textContent = cred.username;
    
    credItem.appendChild(credTitle);
    credItem.appendChild(credUsername);
    
    credItem.addEventListener('click', () => {
      fillLoginForm(cred);
      document.getElementById('keyvault-credential-selector').remove();
    });
    
    credentialList.appendChild(credItem);
  });
}

// Fill login form with credentials
function fillLoginForm(credential) {
  // Find all password fields
  const passwordFields = document.querySelectorAll('input[type="password"]');
  if (!passwordFields.length) return;
  
  // Use the first password field
  const passwordField = passwordFields[0];
  
  // Find the form containing the password field
  const form = passwordField.closest('form');
  
  // Find the username field
  let usernameField = null;
  if (form) {
    usernameField = findUsernameField(form, passwordField);
  }
  
  // Fill in the credentials
  if (passwordField) {
    console.log('Filling password field');
    passwordField.value = credential.password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
    passwordField.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  if (usernameField) {
    console.log('Filling username field:', usernameField);
    usernameField.value = credential.username;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
    usernameField.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Tell the background script that we used a credential
  chrome.runtime.sendMessage({
    action: 'credentialUsed',
    credentialId: credential.id
  });
}

// Fill a field with a generated password
function fillWithGeneratedPassword(password, field) {
  if (!field) {
    // If no field provided, use the active element if it's an input
    if (document.activeElement && 
        document.activeElement.tagName === 'INPUT' && 
        (document.activeElement.type === 'password' || document.activeElement.type === 'text')) {
      field = document.activeElement;
    } else {
      // Find the first password field
      field = document.querySelector('input[type="password"]');
    }
  }
  
  // Fill the field with the password
  if (field) {
    field.value = password;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

// Handle messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  
  if (request.action === "getLoginForms") {
    console.log('Getting login forms');
    const forms = document.querySelectorAll('form');
    const loginForms = [];
    
    forms.forEach((form, formIndex) => {
      const passwordField = form.querySelector('input[type="password"]');
      if (passwordField) {
        const usernameField = findUsernameField(form, passwordField);
        if (usernameField) {
          loginForms.push({
            formIndex,
            usernameField: {
              id: usernameField.id || '',
              name: usernameField.name || '',
              type: usernameField.type || ''
            },
            passwordField: {
              id: passwordField.id || '',
              name: passwordField.name || '',
              type: 'password'
            }
          });
        }
      }
    });
    
    sendResponse({ forms: loginForms });
  } 
  else if (request.action === "fillLoginForm") {
    console.log('Filling login form with credential:', request.credential);
    fillLoginForm(request.credential);
    sendResponse({ success: true });
  }
  else if (request.action === "showCredentialSelector") {
    console.log('Showing credential selector with', request.credentials.length, 'credentials');
    createCredentialSelector();
    populateCredentialSelector(request.credentials);
    sendResponse({ success: true });
  }
  else if (request.action === "fillWithGeneratedPassword") {
    console.log('Filling with generated password');
    fillWithGeneratedPassword(request.password);
    sendResponse({ success: true });
  }
  
  return true; // Required for async response
});
