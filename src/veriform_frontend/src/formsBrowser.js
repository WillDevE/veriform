// Import the backend actor
import { veriform_backend } from "../../declarations/veriform_backend";

// Function to display form keys as buttons
async function displayFormKeys() {
  try {
    const keys = await veriform_backend.getExistingSets();
    console.log('Form keys:', keys);
    const container = document.getElementById('button-container');
    container.innerHTML = ''; // Clear the container before appending new buttons

    // Add the "Create New Form" form at the top
    createFormContainer(container);

    // Render form keys as square buttons in a grid
    const formKeysDiv = document.createElement('div');
    formKeysDiv.classList.add('form-keys-container');

    keys.forEach(key => {
      const formDiv = document.createElement('div');
      formDiv.classList.add('form-key-button');
      const h3 = document.createElement('h3');
      h3.textContent = key;
      const button = document.createElement('button');
      button.classList.add('form-key-btn');
      button.textContent = 'Open';
      button.addEventListener('click', () => {
        window.location.href = `index.html?key=${key}`;
      });
      formDiv.appendChild(h3);
      formDiv.appendChild(button);
      formKeysDiv.appendChild(formDiv);
    });

    container.appendChild(formKeysDiv);
  } catch (error) {
    console.error('Error fetching form keys:', error);
    // Handle the error appropriately, e.g., show an error message to the user
  }
}

// Function to create the "Create New Form" form
function createFormContainer(container) {
  const formContainer = document.createElement('div');
  formContainer.classList.add('add-question-form');
  const form = document.createElement('form');
  form.addEventListener('submit', handleFormSubmission);
  const inputDiv = document.createElement('div');
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'setKey';
  input.placeholder = 'Enter form key';
  input.classList.add('form-input');
  inputDiv.appendChild(input);

  // Add input for setName
  const setNameInput = document.createElement('input');
  setNameInput.type = 'text';
  setNameInput.id = 'setName';
  setNameInput.placeholder = 'Enter form name';
  setNameInput.classList.add('form-input');
  inputDiv.appendChild(setNameInput);

  // Create a checkbox to toggle the password input
  const passwordToggle = document.createElement('input');
  passwordToggle.type = 'checkbox';
  passwordToggle.id = 'passwordToggle';
  passwordToggle.addEventListener('change', () => {
    passwordInput.style.display = passwordToggle.checked ? 'block' : 'none';
  });
  inputDiv.appendChild(passwordToggle);
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'password';
  passwordInput.placeholder = 'Enter password';
  passwordInput.classList.add('form-input');
  passwordInput.style.display = 'none'; // Hide the password input by default
  inputDiv.appendChild(passwordInput);

  const button = document.createElement('button');
  button.type = 'submit';
  button.id = 'create-form';
  button.classList.add('form-btn');
  button.textContent = 'Create New Form';
  inputDiv.appendChild(button);
  form.appendChild(inputDiv);
  formContainer.appendChild(form);
  container.appendChild(formContainer);
}

// Function to handle form submission
let isAddingForm = false;

const handleFormSubmission = async (event) => {
  event.preventDefault();

  // Check if another form is already being added
  if (isAddingForm) {
    console.warn('Another form is already being added. Please wait for the previous operation to complete.');
    return;
  }

  isAddingForm = true;

  const setKey = document.getElementById('setKey').value.trim();
  const setName = document.getElementById('setName').value.trim();
  const passwordToggle = document.getElementById('passwordToggle');
  let password = '';
  if (passwordToggle.checked) { // If the password toggle is checked
    password = document.getElementById('password').value.trim(); // Get the password
  }
  const submitButton = event.target.querySelector('button[type="submit"]');
  // Check if setKey is provided
  if (!setKey) {
    console.error('Please provide a form key.');
    isAddingForm = false;
    return;
  }

  submitButton.disabled = true;
  submitButton.innerHTML = '<span class="loading-icon">&#8635;</span> Creating...';

  try {
    await veriform_backend.addQuestionSet(setKey, password, setName);
    // store key and password in session storage
    sessionStorage.setItem('key', setKey);
    sessionStorage.setItem('password', password);
    // Navigate to the created form
    window.location.href = `index.html?key=${setKey}`;
  } catch (error) {
    console.error('Error creating new form:', error);
    // Handle the error appropriately, e.g., show an error message to the user
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Create New Form';
    isAddingForm = false;
    document.getElementById('setKey').value = '';
    document.getElementById('setName').value = '';
    if (passwordToggle.checked) {
      document.getElementById('password').value = ''; // Clear the password input
    }
  }
};

// Call displayFormKeys on page load
window.addEventListener('DOMContentLoaded', () => {
  displayFormKeys();
});