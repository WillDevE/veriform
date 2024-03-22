// index.js
const questionsDiv = document.getElementById('questions');
const resultsDiv = document.getElementById('results');
const submitButton = document.getElementById('submit-answers');
const resetButton = document.getElementById('reset');
const addQuestionForm = document.getElementById('add-question-form');

// Toggle for dark mode
const body = document.body;
const darkModeToggle = document.createElement('button');
darkModeToggle.classList.add('dark-mode-toggle');

// Set initial mode
function setInitialMode() {
  const preferredMode = localStorage.getItem('preferredMode');

  if (preferredMode === 'dark') {
    body.classList.add('dark-mode');
    document.documentElement.style.backgroundColor = '#1c1c1c';
    darkModeToggle.textContent = '🌙';
  } else {
    body.classList.add('light-mode');
    darkModeToggle.textContent = '☀️';
  }
}

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

// Import the backend actor
import { veriform_backend } from "../../declarations/veriform_backend";

// Fetch questions from the backend and render them
const questionTypeSelect = document.getElementById('question-type');
const questionOptionsInput = document.getElementById('question-options');

//jank fix to make the question options input display in the correct situation.
questionTypeSelect.addEventListener('change', handleQuestionOptionsVisibility);

function handleQuestionOptionsVisibility() {
  const selectedType = questionTypeSelect.value;

  if (selectedType === 'text' || selectedType === 'paragraph' || selectedType === 'linearScale') {
    questionOptionsInput.style.display = 'none';
  } else {
    questionOptionsInput.style.display = 'block';
  }
}

async function fetchAndRenderQuestions() {
  // Clear the existing questions
  questionsDiv.innerHTML = '';

  const questions = await veriform_backend.getQuestions();

  questions.forEach((question, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question-container');

    if (question[0] === 'text') {
      questionDiv.innerHTML = `
        <h3>${index + 1}. ${question[1]}</h3>
        <input type="text" id="answer-${index}" placeholder="Enter your answer">
      `;
    } else if (question[0] === 'radio') {
      questionDiv.innerHTML = `
        <h3>${index + 1}. ${question[1]}</h3>
        ${question[2]
          .map(
            (option, optionIndex) => `
            <label>
              <input type="radio" name="question-${index}" value="${option}" ${
              optionIndex === question[2].length - 1 ? 'data-other="true"' : ''
            }>
              ${option}
            </label>
          `
          )
          .join('')}
        <div class="other-option-input" style="display: none;">
          <input type="text" id="other-answer-${index}" placeholder="Enter your answer">
        </div>
      `;
    } else if (question[0] === 'checkbox') {
      questionDiv.innerHTML = `
        <h3>${index + 1}. ${question[1]}</h3>
        ${question[2]
          .map(
            (option) => `
            <label>
              <input type="checkbox" name="question-${index}" value="${option}">
              ${option}
            </label>
          `
          )
          .join('')}
      `;
    } else if (question[0] === 'paragraph') {
      questionDiv.innerHTML = `
        <h3>${index + 1}. ${question[1]}</h3>
        <textarea id="answer-${index}" placeholder="Enter your answer"></textarea>
      `;
    } else if (question[0] === 'dropdown') {
      questionDiv.innerHTML = `
        <h3>${index + 1}. ${question[1]}</h3>
        <select id="answer-${index}">
          ${question[2]
            .map((option) => `<option value="${option}">${option}</option>`)
            .join('')}
        </select>
      `;
    } else if (question[0] === 'linearScale') {
      questionDiv.innerHTML = `
        <h3>${index + 1}. ${question[1]}</h3>
        <div class="linear-scale">
          <span>Poor</span>
          ${Array.from({ length: 5 }, (_, i) => `<input type="radio" name="question-${index}" value="${i + 1}">`)
            .join('')}
          <span>Excellent</span>
        </div>
      `;
    }

    questionsDiv.appendChild(questionDiv);
  });

  // Add event listeners for radio buttons
  const radioInputs = document.querySelectorAll('input[type="radio"]');

  radioInputs.forEach((radioInput) => {
    radioInput.addEventListener('change', () => {
      const questionType = questions.find((q, i) => i === Number(radioInput.name.split('-')[1]))[0];
      if (questionType !== 'linearScale') {
        const otherOptionInput = radioInput.parentNode.parentNode.querySelector('.other-option-input input[type="text"]');
        const otherOptionContainer = radioInput.parentNode.parentNode.querySelector('.other-option-input');

        if (radioInput.dataset.other === 'true') {
          if (radioInput.checked) {
            otherOptionContainer.style.display = 'block';
          } else {
            otherOptionContainer.style.display = 'none';
            otherOptionInput.value = ''; // Clear the input value when a different option is selected
          }
        } else {
          otherOptionContainer.style.display = 'none';
          otherOptionInput.value = ''; // Clear the input value when a different option is selected
        }
      }
    });
  });
}

// Handle submit button click
let isSubmitting = false;

submitButton.addEventListener('click', async () => {
  if (!submitButton.disabled && !isSubmitting) {
    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-icon">&#8635;</span> Submitting...';

    const questions = await veriform_backend.getQuestions();
    const answers = [];

    // Loop through questions and collect user answers
    for (let i = 0; i < questions.length; i++) {
      const [questionType, questionText, questionOptions] = questions[i];
      let answer = '';

      if (questionType === 'text') {
        const textInput = document.querySelector(`#answer-${i}`);
        answer = textInput.value.trim();
      } else if (questionType === 'radio') {
        const selectedRadio = document.querySelector(`input[name="question-${i}"]:checked`);
        answer = selectedRadio ? selectedRadio.value : '';

        // If the 'Other' option is selected, get the value from the text input
        if (answer === questionOptions[questionOptions.length - 1]) {
          const otherInput = document.querySelector(`#other-answer-${i}`);
          answer = otherInput.value.trim();
        }
      } else if (questionType === 'checkbox') {
        const selectedCheckboxes = Array.from(document.querySelectorAll(`input[name="question-${i}"]:checked`));
        answer = selectedCheckboxes.map(checkbox => checkbox.value).join(', ');
      } else if (questionType === 'paragraph') {
        const textArea = document.querySelector(`#answer-${i}`);
        answer = textArea.value.trim();
      } else if (questionType === 'dropdown') {
        const dropdown = document.querySelector(`#answer-${i}`);
        answer = dropdown.value;
      } else if (questionType === 'linearScale') {
        const selectedRadio = document.querySelector(`input[name="question-${i}"]:checked`);
        answer = selectedRadio ? selectedRadio.value : '';
      }

      // Add the question and answer to the answers array if an answer is provided
      if (answer) {
        answers.push([questionText, answer]);
      }
    }

    // Add all answers to the backend at once
    await veriform_backend.addAnswers(answers);

    // Get the updated results from the backend and display them
    const results = await veriform_backend.getResults();
    displayResults(results);

    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit Answers';
    isSubmitting = false;
  }
});

// Display the poll results
function displayResults(results) {
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
}

// Load initial questions and results from the backend (also call option hiding function)
document.addEventListener('DOMContentLoaded', async () => {
  await fetchAndRenderQuestions();
  const results = await veriform_backend.getResults();
  displayResults(results);
  handleQuestionOptionsVisibility();
});

// Reset the poll data
resetButton.addEventListener('click', async () => {
  await veriform_backend.clearData();
  displayResults([]);
});

// Handle adding a new question
addQuestionForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const questionType = document.getElementById('question-type').value;
  const questionText = document.getElementById('question-text').value;
  const questionOptions = document.getElementById('question-options').value;
  const options = questionOptions ? questionOptions.split(',').map(option => option.trim()) : [];

  const submitButton = addQuestionForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Adding...';

  try {
    await veriform_backend.addQuestion(questionType, questionText, options);
    addQuestionForm.reset();
    await fetchAndRenderQuestions();
  } catch (error) {
    console.error('Error adding question:', error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Add Question';
  }
});