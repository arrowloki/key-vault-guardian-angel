
// This script runs on web pages to detect forms and enable autofill

// Listen for messages from the extension popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getLoginForms") {
    const forms = detectLoginForms();
    sendResponse({ forms });
  } else if (request.action === "fillLoginForm") {
    fillLoginForm(request.credentials);
    sendResponse({ success: true });
  }
  return true; // Required for async response
});

// Detect login forms on the page
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

// Fill a login form with credentials
function fillLoginForm(credentials) {
  const { username, password, formIndex } = credentials;
  
  const forms = document.querySelectorAll('form');
  if (!forms[formIndex]) return;
  
  const form = forms[formIndex];
  
  // Find the username and password fields
  const passwordFields = form.querySelectorAll('input[type="password"]');
  const potentialUsernameFields = form.querySelectorAll(
    'input[type="text"], input[type="email"], input:not([type="password"])'
  );
  
  // Fill in the password
  if (passwordFields.length > 0) {
    passwordFields[0].value = password;
    passwordFields[0].dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Find and fill the username field
  potentialUsernameFields.forEach(field => {
    if (field.offsetTop <= passwordFields[0].offsetTop) {
      field.value = username;
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}
