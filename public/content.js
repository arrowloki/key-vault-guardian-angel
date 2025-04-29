
// Content script for Key Vault Guardian Angel
// This script runs on web pages to detect forms, capture passwords, and enable autofill

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
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '2147483647';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#fff';
  modalContent.style.borderRadius = '8px';
  modalContent.style.padding = '20px';
  modalContent.style.maxWidth = '400px';
  modalContent.style.width = '100%';
  modalContent.style.maxHeight = '80vh';
  modalContent.style.overflow = 'auto';
  modalContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  
  // Create header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '15px';
  
  const title = document.createElement('h2');
  title.textContent = 'Choose a credential';
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.fontWeight = 'bold';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => modal.remove();
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  
  // Create credential list container
  const credentialList = document.createElement('div');
  credentialList.id = 'keyvault-credential-list';
  credentialList.style.marginTop = '10px';
  
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
    noCredentials.textContent = 'No credentials found for this site.';
    credentialList.appendChild(noCredentials);
    return;
  }
  
  credentials.forEach(cred => {
    const credItem = document.createElement('div');
    credItem.style.padding = '10px';
    credItem.style.margin = '5px 0';
    credItem.style.borderRadius = '4px';
    credItem.style.cursor = 'pointer';
    credItem.style.border = '1px solid #e0e0e0';
    credItem.style.transition = 'background-color 0.2s';
    
    const credTitle = document.createElement('div');
    credTitle.textContent = cred.title || 'Untitled';
    credTitle.style.fontWeight = 'bold';
    
    const credUsername = document.createElement('div');
    credUsername.textContent = cred.username;
    credUsername.style.fontSize = '14px';
    credUsername.style.color = '#666';
    
    credItem.appendChild(credTitle);
    credItem.appendChild(credUsername);
    
    credItem.addEventListener('mouseover', () => {
      credItem.style.backgroundColor = '#f5f5f5';
    });
    
    credItem.addEventListener('mouseout', () => {
      credItem.style.backgroundColor = '';
    });
    
    credItem.addEventListener('click', () => {
      fillLoginForm(cred);
      document.getElementById('keyvault-credential-selector').remove();
    });
    
    credentialList.appendChild(credItem);
  });
}

// Function to detect login forms on the page
function detectLoginForms() {
  const forms = [];
  
  // Find all forms
  document.querySelectorAll('form').forEach((form, formIndex) => {
    // Check for password fields
    const passwordFields = form.querySelectorAll('input[type="password"]');
    
    if (passwordFields.length > 0) {
      // Try to find username/email field
      let usernameField = null;
      
      // Look for typical username/email input types
      const potentialUsernameFields = form.querySelectorAll(
        'input[type="text"], input[type="email"], input:not([type="password"])'
      );
      
      // Get the username field that comes before the password field
      potentialUsernameFields.forEach(field => {
        if (!usernameField && field.offsetTop <= passwordFields[0].offsetTop) {
          usernameField = field;
        }
      });
      
      if (usernameField) {
        forms.push({
          formIndex,
          usernameField: {
            id: usernameField.id || '',
            name: usernameField.name || '',
            type: usernameField.type || ''
          },
          passwordField: {
            id: passwordFields[0].id || '',
            name: passwordFields[0].name || '',
            type: 'password'
          }
        });
      }
    }
  });
  
  return forms;
}

// Fill login form with credentials
function fillLoginForm(credential) {
  // Find all password fields
  const passwordFields = document.querySelectorAll('input[type="password"]');
  if (!passwordFields.length) return;
  
  // Use the first password field
  const passwordField = passwordFields[0];
  
  // Find the likely username field
  let usernameField = null;
  const form = passwordField.closest('form');
  
  // If we found a form, look for username fields within it
  if (form) {
    // First try to find fields before the password field
    const possibleFields = form.querySelectorAll('input[type="text"], input[type="email"], input:not([type="password"])');
    for (const field of possibleFields) {
      if (field.offsetTop <= passwordField.offsetTop) {
        usernameField = field;
      }
    }
    
    // If no field was found before, take the first input field that's not a password
    if (!usernameField) {
      usernameField = form.querySelector('input:not([type="password"])');
    }
  } else {
    // If no form found, look for inputs near the password field
    const allInputs = document.querySelectorAll('input:not([type="password"])');
    for (const input of allInputs) {
      const inputRect = input.getBoundingClientRect();
      const pwRect = passwordField.getBoundingClientRect();
      
      // Check if input is close to password field
      const verticalDistance = Math.abs(inputRect.top - pwRect.top);
      if (verticalDistance < 150) {
        usernameField = input;
        break;
      }
    }
  }
  
  // Fill in the credentials
  if (passwordField) {
    passwordField.value = credential.password;
    passwordField.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  if (usernameField) {
    usernameField.value = credential.username;
    usernameField.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // If there's a form, set up submission detection
  if (form) {
    // Tell the background script that we used a credential
    chrome.runtime.sendMessage({
      action: 'credentialUsed',
      credentialId: credential.id
    });
  }
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
  }
}

// Handle messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  
  if (request.action === "getLoginForms") {
    const forms = detectLoginForms();
    sendResponse({ forms });
  } 
  else if (request.action === "fillLoginForm") {
    fillLoginForm(request.credential);
    sendResponse({ success: true });
  }
  else if (request.action === "showCredentialSelector") {
    createCredentialSelector();
    populateCredentialSelector(request.credentials);
    sendResponse({ success: true });
  }
  else if (request.action === "fillWithGeneratedPassword") {
    fillWithGeneratedPassword(request.password);
    sendResponse({ success: true });
  }
  
  return true; // Required for async response
});

// Set up form submission detection
document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    if (form.querySelector('input[type="password"]')) {
      form.addEventListener('submit', function(e) {
        // Find username and password fields
        const passwordField = form.querySelector('input[type="password"]');
        const usernameField = form.querySelector('input[type="text"], input[type="email"]');
        
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
      });
    }
  });
});

// Add CSS for the badge
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
    transition: background-color 0.2s;
  }
  .keyvault-badge:hover {
    background-color: #8b5cf6;
  }
`;
document.head.appendChild(style);
