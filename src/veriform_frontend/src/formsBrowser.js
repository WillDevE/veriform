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
  input.placeholder = 'Enter form name';
  input.classList.add('form-input');
  inputDiv.appendChild(input);
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

  if (!isAddingForm) {
    isAddingForm = true;
    const setKey = document.getElementById('setKey').value.trim();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-icon">&#8635;</span> Creating...';

    if (setKey) {
      try {
        const key = await veriform_backend.addQuestionSet(setKey);
        console.log('New form key:', key);
        displayFormKeys(); // Call this function to reload the list of forms
      } catch (error) {
        console.error('Error creating new form:', error);
      } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Create New Form';
        isAddingForm = false;
        document.getElementById('setKey').value = '';
      }
    }
  }
};

// Call displayFormKeys on page load
window.addEventListener('DOMContentLoaded', () => {
  displayFormKeys();
});