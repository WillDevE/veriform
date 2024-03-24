// Import the backend actor
import { veriform_backend } from "../../declarations/veriform_backend";

// Get DOM elements
const questionsDiv = document.getElementById('questions');
const resultsDiv = document.getElementById('results');
const submitButton = document.getElementById('submit-answers');
const resetButton = document.getElementById('reset');
const addQuestionForm = document.getElementById('add-question-form');
const questionTypeSelect = document.getElementById('question-type');
const questionOptionsHolder = document.getElementById('question-options-holder');

let setKey;
let isSubmitting = false;

// Hide the options if the question type doesn't require it
questionTypeSelect.addEventListener('change', () => {
  const selectedType = questionTypeSelect.value;

  if (selectedType === 'text' || selectedType === 'paragraph' || selectedType === 'linearScale') {
    questionOptionsHolder.style.display = 'none';
  } else {
    questionOptionsHolder.style.display = 'block';
  }
});

// Fetch and render questions
const fetchAndRenderQuestions = async () => {
  questionsDiv.innerHTML = '';

  // Check if key is present in the URL
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const keyFromURL = params.get('key');

  // Get existing sets or create a new one
  const existingSets = await veriform_backend.getExistingSets();
  if (keyFromURL && existingSets.includes(keyFromURL)) {
    setKey = keyFromURL;
  } else {
    if (existingSets.length === 0) {
      setKey = prompt('Please enter a new set key to create a form:');
      if (!setKey) {
        return;
      }
      await veriform_backend.addQuestionSet(setKey);
    } else {
      setKey = prompt(`Please enter an existing set key or a new set key to create a new form:`);
      if (!setKey) {
        return;
      }
      if (!existingSets.includes(setKey)) {
        await veriform_backend.addQuestionSet(setKey);
      }
    }
  }

  const questions = await veriform_backend.getQuestions(setKey);

  // Render each question
  questions.forEach((question, index) => {
    renderQuestion(question, index);
  });

  // Add event listeners for radio buttons
  const radioInputs = document.querySelectorAll('input[type="radio"]');
  radioInputs.forEach((radioInput) => {
    radioInput.addEventListener('change', toggleOtherInput);
  });
};

// Render a single question (format is stored here)
const renderQuestion = (question, index) => {
  const [questionType, questionText, questionOptions] = question;
  const questionDiv = document.createElement('div');
  questionDiv.classList.add('question-container');

  // Show the set key at the top
  if (index === 0) {
    const setKeyDiv = document.createElement('div');
    setKeyDiv.textContent = `Current Set Key (TEMPORARY REMOVE PLS): ${setKey}`;
    questionsDiv.appendChild(setKeyDiv);
  }

  if (questionType === 'text') {
    questionDiv.innerHTML = `
      <h3>${index + 1}. ${questionText}</h3>
      <input type="text" id="answer-${index}" placeholder="Enter your answer">
    `;
  } else if (questionType === 'radio') {
    questionDiv.innerHTML = `
      <h3>${index + 1}. ${questionText}</h3>
      ${questionOptions.map((option, optionIndex) => `
        <label>
          <input type="radio" name="question-${index}" value="${option}" ${
            optionIndex === questionOptions.length - 1 && option.toLowerCase() === 'other' ? 'data-other="true"' : ''
          }>
          ${option}
        </label>
      `).join('')}
      <div class="other-option-input" style="display: none;">
        <input type="text" id="other-answer-${index}" placeholder="Enter your answer">
      </div>
    `;
  } else if (questionType === 'checkbox') {
    questionDiv.innerHTML = `
      <h3>${index + 1}. ${questionText}</h3>
      ${questionOptions.map(option => `
        <label>
          <input type="checkbox" name="question-${index}" value="${option}">
          ${option}
        </label>
      `).join('')}
    `;
  } else if (questionType === 'paragraph') {
    questionDiv.innerHTML = `
      <h3>${index + 1}. ${questionText}</h3>
      <textarea id="answer-${index}" placeholder="Enter your answer"></textarea>
    `;
  } else if (questionType === 'dropdown') {
    questionDiv.innerHTML = `
      <h3>${index + 1}. ${questionText}</h3>
      <select id="answer-${index}">
        ${questionOptions.map(option => `<option value="${option}">${option}</option>`).join('')}
      </select>
    `;
  } else if (questionType === 'linearScale') {
    questionDiv.innerHTML = `
      <h3>${index + 1}. ${questionText}</h3>
      <div class="linear-scale">
        <span>Poor</span>
        ${Array.from({ length: 5 }, (_, i) => `<input type="radio" name="question-${index}" value="${i + 1}">`).join('')}
        <span>Excellent</span>
      </div>
    `;
  }

  questionsDiv.appendChild(questionDiv);
};

// Toggle the display of the "Other" input for radio buttons
const toggleOtherInput = (event) => {
  const otherOptionInput = event.target.parentNode.parentNode.querySelector('.other-option-input input[type="text"]');
  const otherOptionContainer = event.target.parentNode.parentNode.querySelector('.other-option-input');

  if (event.target.dataset.other === 'true') {
    otherOptionContainer.style.display = event.target.checked ? 'block' : 'none';
    if (!event.target.checked) otherOptionInput.value = '';
  } else {
    otherOptionContainer.style.display = 'none';
    otherOptionInput.value = '';
  }
};

// Handle submit button click
const submitAnswers = async () => {
  if (!submitButton.disabled && !isSubmitting) {
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-icon">&#8635;</span> Submitting...';

    const selectedSetKey = setKey;
    const questions = await veriform_backend.getQuestions(selectedSetKey);
    const answers = [];

    // Loop through questions and collect user answers
    for (let i = 0; i < questions.length; i++) {
      const [questionType, questionText, questionOptions] = questions[i];
      let answer = '';

      if (questionType === 'text') {
        answer = document.querySelector(`#answer-${i}`).value.trim();
      } else if (questionType === 'radio') {
        const selectedRadio = document.querySelector(`input[name="question-${i}"]:checked`);
        const otherInput = document.querySelector(`#other-answer-${i}`);

        if (selectedRadio) {
          answer = selectedRadio.dataset.other === 'true' ? (otherInput.value.trim() || selectedRadio.value) : selectedRadio.value;
        }
      } else if (questionType === 'checkbox') {
        const selectedCheckboxes = Array.from(document.querySelectorAll(`input[name="question-${i}"]:checked`));
        answer = selectedCheckboxes.map(checkbox => checkbox.value).join(', ');
      } else if (questionType === 'paragraph') {
        answer = document.querySelector(`#answer-${i}`).value.trim();
      } else if (questionType === 'dropdown') {
        answer = document.querySelector(`#answer-${i}`).value;
      } else if (questionType === 'linearScale') {
        const selectedRadio = document.querySelector(`input[name="question-${i}"]:checked`);
        answer = selectedRadio ? selectedRadio.value : '';
      }

      // Add the question and answer to the answers array if an answer is provided
      if (answer) answers.push([questionText, answer]);
    }

    // Add all answers to the backend at once
    await veriform_backend.addAnswers(setKey, answers);

    // Get the updated results from the backend and display them
    const results = await veriform_backend.getResults(setKey);
    displayResults(results);

    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit Answers';
    isSubmitting = false;
  }
};

// Display the poll results
const displayResults = (results) => {
  resultsDiv.innerHTML = '';

  results.forEach(([question, answers]) => {
    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = `<h3>${question}</h3>`;

    const answersDiv = document.createElement('div');

    answers.forEach(([answer, count]) => {
      const answerDiv = document.createElement('div');
      answerDiv.textContent = `- ${answer}: ${count}`;
      answersDiv.appendChild(answerDiv);
    });

    questionDiv.appendChild(answersDiv);
    resultsDiv.appendChild(questionDiv);
  });
};

// Reset the poll data
const resetData = async () => {
  resetButton.disabled = true;
  resetButton.innerHTML = '<span class="loading-icon">&#8635;</span> Resetting...';

  try {
    await veriform_backend.clearData(setKey);
    displayResults([]);
    await fetchAndRenderQuestions();
  } catch (error) {
    console.error('Error resetting data:', error);
    alert('An error occurred while resetting the data. Please try again.');
  } finally {
    resetButton.disabled = false;
    resetButton.innerHTML = 'Reset';
  }
};

// Handle adding a new question
const addNewQuestion = async (event) => {
  event.preventDefault();

  const questionType = document.getElementById('question-type').value;
  const questionText = document.getElementById('question-text').value;
  const questionOptions = document.getElementById('question-options').value;
  const options = questionOptions ? questionOptions.split(',').map(option => option.trim()) : [];
  const submitButton = addQuestionForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Adding...';

  try {
    const selectedSetKey = setKey;
    await veriform_backend.addQuestion(selectedSetKey, questionType, questionText, options);
    addQuestionForm.reset();
    await fetchAndRenderQuestions();
  } catch (error) {
    console.error('Error adding question:', error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Add Question';
  }
};

// Toggle for dark mode
const body = document.body;
const darkModeToggle = document.createElement('button');
darkModeToggle.classList.add('dark-mode-toggle');

// Set initial mode
const setInitialMode = () => {
  const preferredMode = localStorage.getItem('preferredMode');

  if (preferredMode === 'dark') {
    body.classList.add('dark-mode');
    document.documentElement.style.backgroundColor = '#1c1c1c';
    darkModeToggle.textContent = '🌙';
  } else {
    body.classList.add('light-mode');
    darkModeToggle.textContent = '☀️';
  }
};

setInitialMode();

// Toggle dark mode
darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  body.classList.toggle('light-mode');

  if (body.classList.contains('dark-mode')) {
    document.documentElement.style.backgroundColor = '#1c1c1c';
    localStorage.setItem('preferredMode', 'dark');
    darkModeToggle.textContent = '🌙';
  } else {
    document.documentElement.style.backgroundColor = '#fff';
    localStorage.setItem('preferredMode', 'light');
    darkModeToggle.textContent = '☀️';
  }
});

// Add the toggle button to the document
document.body.appendChild(darkModeToggle);

// Event listeners
submitButton.addEventListener('click', submitAnswers);
resetButton.addEventListener('click', resetData);
addQuestionForm.addEventListener('submit', addNewQuestion);
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAndRenderQuestions();
  const selectedSetKey = setKey;
  await displayResults(await veriform_backend.getResults(selectedSetKey));
});