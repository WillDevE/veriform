// Import the backend actor
import { veriform_backend } from "../../declarations/veriform_backend";

// Function to display form keys as buttons
async function displayFormKeys() {
  try {
    const keys = await veriform_backend.getExistingSets();
    console.log('Form keys:', keys);
    const container = document.getElementById('button-container');
    keys.forEach(key => {
      const button = document.createElement('button');
      button.textContent = key;
      button.addEventListener('click', () => {
        window.location.href = `index.html?key=${key}`;
      });
      container.appendChild(button);
    });
  } catch (error) {
    console.error('Error fetching form keys:', error);
  }
}

displayFormKeys()