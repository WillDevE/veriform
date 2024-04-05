import { veriform_backend } from "../../declarations/veriform_backend";

// Function to display form keys as buttons

async function displayFormKeys() {
  try {
    const keys = await veriform_backend.getExistingSets(); 
    const container = document.getElementById('button-container');
    container.innerHTML = ''; 

    createFormContainer(container); 

    const formKeysDiv = document.createElement('div');
    formKeysDiv.classList.add('form-keys-container');

    keys.forEach(([key, name]) => { // Destructure tuple elements
      const formDiv = document.createElement('div');
      formDiv.classList.add('form-key-button');

      const keyHeading = document.createElement('h3');
      keyHeading.textContent = name; 

      const openButton = document.createElement('button');
      openButton.classList.add('form-key-btn');
      openButton.textContent = 'Open';
      openButton.addEventListener('click', () => {
        //add key to session storage
        sessionStorage.setItem('key', key);
        window.location.href = `index.html?key=${key}`;
      });

      formDiv.appendChild(keyHeading);
      formDiv.appendChild(openButton);
      formKeysDiv.appendChild(formDiv);
    });

    container.appendChild(formKeysDiv);
  } catch (error) {
    console.error('Error fetching form keys:', error);
    // Display an error message to the user
  }
}

// Function to create the "Create New Form" container
function createFormContainer(container) {
  
  const formContainer = document.createElement('div');
  formContainer.classList.add('add-question-form');

  const form = document.createElement('form');
  form.addEventListener('submit', handleFormSubmission);

  const inputDiv = document.createElement('div');

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.id = 'setKey';
  keyInput.placeholder = 'Enter form key';
  keyInput.classList.add('form-input');
  inputDiv.appendChild(keyInput);

  const setNameInput = document.createElement('input');
  setNameInput.type = 'text';
  setNameInput.id = 'setName';
  setNameInput.placeholder = 'Enter form name';
  setNameInput.classList.add('form-input');
  inputDiv.appendChild(setNameInput);

  const passwordToggle = document.createElement('input');
  passwordToggle.type = 'checkbox';
  passwordToggle.id = 'passwordToggle';
  passwordToggle.addEventListener('change', () => {
    passwordInput.style.display = passwordToggle.checked ? 'block' : 'none';
  });
  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Private (Passworded)';
  passwordLabel.htmlFor = 'passwordToggle';
  inputDiv.appendChild(passwordToggle);
  inputDiv.appendChild(passwordLabel);

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'password';
  passwordInput.placeholder = 'Enter password';
  passwordInput.classList.add('form-input');
  passwordInput.style.display = 'none'; 
  inputDiv.appendChild(passwordInput);

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.id = 'create-form';
  submitButton.classList.add('form-btn');
  submitButton.textContent = 'Create New Form';
  inputDiv.appendChild(submitButton);

  form.appendChild(inputDiv);
  formContainer.appendChild(form);
  container.appendChild(formContainer);

  formContainer.appendChild(document.createElement('br'));
  formContainer.appendChild(document.createElement('br'));
  const textContainer = document.createElement('div');
  textContainer.classList.add('form-separator-text');
  textContainer.textContent = 'Navigate to an existing form:'; 
  formContainer.appendChild(textContainer);
  // Manual Navigation elements
  const manualNavDiv = document.createElement('div');
  manualNavDiv.classList.add('manual-nav');

  const manualKeyInput = document.createElement('input');
  manualKeyInput.type = 'text';
  manualKeyInput.id = 'manualKey';
  manualKeyInput.placeholder = 'Enter form key';
  manualKeyInput.classList.add('form-input');
  manualNavDiv.appendChild(manualKeyInput);

  const manualPasswordInput = document.createElement('input');
  manualPasswordInput.type = 'password';
  manualPasswordInput.id = 'manualPassword';
  manualPasswordInput.placeholder = 'Enter password (optional)';
  manualPasswordInput.classList.add('form-input');
  manualNavDiv.appendChild(manualPasswordInput);

  const navigateButton = document.createElement('button');
  navigateButton.id = 'navigate-form';
  navigateButton.classList.add('form-btn');
  navigateButton.textContent = 'Navigate';
  navigateButton.addEventListener('click', handleManualNavigation);
  manualNavDiv.appendChild(navigateButton);

  formContainer.appendChild(manualNavDiv);
}

// Function to handle form submission
async function handleFormSubmission(event) {
  sessionStorage.clear();
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');

  try {
    const setKey = form.setKey.value.trim();
    const setName = form.setName.value.trim();
    const password = form.passwordToggle.checked ? form.password.value.trim() : '';

    if (!setKey) {
      throw new Error('Please provide a form key.');
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-icon">&#8635;</span> Creating...';

    await veriform_backend.addQuestionSet(setKey, password, setName);
    sessionStorage.setItem('key', setKey);
    sessionStorage.setItem('password', password);
    window.location.href = `index.html?key=${setKey}`;

  } catch (error) {
    console.error('Error creating new form:', error);
    alert('Error: ' + error.message); 
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Create New Form';
    form.reset(); 
  }
}

// Function to handle manual navigation
async function handleManualNavigation() {
  sessionStorage.clear();
  const keyInput = document.getElementById('manualKey');
  const passwordInput = document.getElementById('manualPassword');
  const navigateButton = document.getElementById('navigate-form');

  const key = keyInput.value.trim();
  const password = passwordInput.value.trim();

  if (!key) {
    alert('Please enter a form key.');
    return;
  }

  navigateButton.disabled = true;
  navigateButton.innerHTML = '<span class="loading-icon">&#8635;</span> Navigating...';

  try {
    const keyExists = await veriform_backend.checkSetExists(key, password);

    if (keyExists) {
      sessionStorage.setItem('key', key);
      sessionStorage.setItem('password', password);
      window.location.href = `index.html?key=${key}`;
    } else {
      alert('Invalid key or password.');
    }
  } catch (error) {
    console.error('Error during navigation:', error);
    alert('Error: ' + error.message); // Show an error message.
  } finally {
    navigateButton.disabled = false;
    navigateButton.innerHTML = 'Navigate';
  }
}

// Call displayFormKeys on page load
window.addEventListener('DOMContentLoaded', () => {
  displayFormKeys();
});
