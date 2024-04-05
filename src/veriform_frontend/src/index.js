// Import the backend actor
import { veriform_backend } from "../../declarations/veriform_backend";

// Get DOM elements
const questionsDiv = document.getElementById('questions');
const resultsDiv = document.getElementById('results');
const submitButton = document.getElementById('submit-answers');
const resetButton = document.getElementById('reset');
const addQuestionForm = document.getElementById('add-question-form');
const addQuestionButton = document.getElementById('add-question-btn');

let setKey;
let isSubmitting = false;
let formIsPrivate = false;

// Retrieve the password from session storage
const password = sessionStorage.getItem('password') || "";
const sessionKey = sessionStorage.getItem('key');

// Question types with corresponding option input visibility
const questionTypes = {
    text: false,
    radio: true,
    checkbox: true,
    paragraph: false,
    dropdown: true,
    linearScale: false
};

// Function to create a new question section
const createQuestionSection = () => {
    const questionSection = document.createElement('div');
    questionSection.classList.add('question-section');
    questionSection.innerHTML = `
        <label for="question-type">Question Type:</label>
        <select class="question-type" name="question-type">
            ${Object.keys(questionTypes).map(type => `
                <option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>
            `).join('')}
        </select>
        <br>
        <label for="question-text">Question Text:</label>
        <input type="text" class="question-text" name="question-text" required>
        <br>
        <div class="question-options-holder" style="display: none;">
            <label for="question-options">Question Options (comma-separated):</label>
            <input type="text" class="question-options" name="question-options">
            <br>
        </div>
        <button type="button" class="remove-question">Remove Question</button>
    `;

    const questionTypeSelect = questionSection.querySelector('.question-type');
    const questionOptionsHolder = questionSection.querySelector('.question-options-holder');

    // Add event listener to question type select element
    questionTypeSelect.addEventListener('change', () => {
        const selectedType = questionTypeSelect.value;
        questionOptionsHolder.style.display = questionTypes[selectedType] ? 'block' : 'none';
    });

    const removeQuestionButton = questionSection.querySelector('.remove-question');
    removeQuestionButton.addEventListener('click', () => {
        questionSection.remove();
    });

    return questionSection;
};

// Fetch and render questions
const fetchAndRenderQuestions = async () => {
    questionsDiv.innerHTML = '';

    // Check if key is present in the URL
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const keyFromURL = params.get('key');

    // check if set exists
    if (password.length > 0) {
        const selectedPassword = password;
        if (veriform_backend.checkSetExists(sessionKey, selectedPassword)) {
            formIsPrivate = true;
            if (sessionKey) {
                setKey = sessionKey;
            }
        } else {
            alert('Invalid key or password, please try again');
            window.location.href = 'formsBrowser.html';
        }
    } else {
        console.log("session key is:", sessionKey);
        formIsPrivate = false;
        const existingSets = await veriform_backend.getExistingSets();
        const formKeys = existingSets.map(set => set[0]);
        console.log("Form keys are:", formKeys);
        if (sessionKey && formKeys.includes(sessionKey)) {
            setKey = sessionKey;
        } else if (keyFromURL && formKeys.includes(keyFromURL)) {
            setKey = keyFromURL;
        } else {
            alert('Invalid or no key found, please try again');
            window.location.href = 'formsBrowser.html';
        }
    }
    const selectedPassword = password;
    const questions = await veriform_backend.getQuestions(setKey, selectedPassword);

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

    switch (questionType) {
        case 'text':
            questionDiv.innerHTML = `
                <h3>${index + 1}. ${questionText}</h3>
                <input type="text" id="answer-${index}" placeholder="Enter your answer">
            `;
            break;
        case 'radio':
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
            break;
        case 'checkbox':
            questionDiv.innerHTML = `
                <h3>${index + 1}. ${questionText}</h3>
                ${questionOptions.map(option => `
                    <label>
                        <input type="checkbox" name="question-${index}" value="${option}">
                        ${option}
                    </label>
                `).join('')}
            `;
            break;
        case 'paragraph':
            questionDiv.innerHTML = `
                <h3>${index + 1}. ${questionText}</h3>
                <textarea id="answer-${index}" placeholder="Enter your answer"></textarea>
            `;
            break;
        case 'dropdown':
            questionDiv.innerHTML = `
                <h3>${index + 1}. ${questionText}</h3>
                <select id="answer-${index}">
                    ${questionOptions.map(option => `<option value="${option}">${option}</option>`).join('')}
                </select>
            `;
            break;
        case 'linearScale':
            questionDiv.innerHTML = `
                <h3>${index + 1}. ${questionText}</h3>
                <div class="linear-scale">
                    <span>Poor</span>
                    ${Array.from({ length: 5 }, (_, i) => `<input type="radio" name="question-${index}" value="${i + 1}">`).join('')}
                    <span>Excellent</span>
                </div>
            `;
            break;
    }

    questionsDiv.appendChild(questionDiv);
};

// Toggle the display of the "Other" input for radio buttons
const toggleOtherInput = (event) => {
  const otherOptionInput = event.target.parentNode.parentNode.querySelector('.other-option-input input[type="text"]');
  const otherOptionContainer = event.target.parentNode.parentNode.querySelector('.other-option-input');

  if (otherOptionContainer) {
      otherOptionContainer.style.display = event.target.dataset.other === 'true' ? 'block' : 'none';
      if (!event.target.checked) otherOptionInput.value = '';
  }
};

// Handle submit button click
const submitAnswers = async () => {
  if (!submitButton.disabled && !isSubmitting) {
      isSubmitting = true;
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="loading-icon">↻</span> Submitting...';
      const selectedPassword = password;
      const questions = await veriform_backend.getQuestions(setKey, selectedPassword);
      const answers = [];

      // Loop through questions and collect user answers
      for (let i = 0; i < questions.length; i++) {
          const [questionType, questionText, questionOptions] = questions[i];
          let answer = '';

          switch (questionType) {
              case 'text':
                  answer = document.querySelector(`#answer-${i}`).value.trim();
                  break;
              case 'radio':
                  const selectedRadios = document.querySelectorAll(`input[name="question-${i}"]:checked`);
                  if (selectedRadios.length > 0) {
                      const otherInput = document.querySelector(`#other-answer-${i}`);
                      answer = Array.from(selectedRadios).map(radio => {
                          if (radio.dataset.other === 'true') {
                              return otherInput.value.trim() || radio.value;
                          } else {
                              return radio.value;
                          }
                      }).join(', ');
                  }
                  break;
              case 'checkbox':
                  const selectedCheckboxes = Array.from(document.querySelectorAll(`input[name="question-${i}"]:checked`));
                  answer = selectedCheckboxes.map(checkbox => checkbox.value).join(', ');
                  break;
              case 'paragraph':
                  answer = document.querySelector(`#answer-${i}`).value.trim();
                  break;
              case 'dropdown':
                  answer = document.querySelector(`#answer-${i}`).value;
                  break;
              case 'linearScale':
                  const selectedRadio = document.querySelector(`input[name="question-${i}"]:checked`);
                  answer = selectedRadio ? selectedRadio.value : '';
                  break;
          }

          // Add the question and answer to the answers array if an answer is provided
          if (answer) answers.push([questionText, answer]);
      }

      // Add all answers to the backend at once
      await veriform_backend.addAnswers(setKey, selectedPassword, answers);

      // Get the updated results from the backend and display them
      const results = await veriform_backend.getResults(setKey, password);
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
    resetButton.innerHTML = '<span class="loading-icon">↻</span> Resetting...';
    try {
        const selectedPassword = password;
        await veriform_backend.clearData(setKey, selectedPassword);
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

// Handle adding new questions
const addNewQuestions = async (event) => {
  event.preventDefault();
  const questionSections = document.querySelectorAll('.question-section');
  const submitButton = addQuestionForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Adding...';

  try {
      const selectedPassword = password;
      const selectedSetKey = setKey;

      let questionType, questionText, options; // Declare variables outside the loop

      for (let i = 0; i < questionSections.length; i++) {
          const questionTypeSelect = questionSections[i].querySelector('.question-type');
          const questionTextInput = questionSections[i].querySelector('.question-text');
          const questionOptionsInput = questionSections[i].querySelector('.question-options');

          questionType = questionTypeSelect.value;
          questionText = questionTextInput.value;
          options = questionOptionsInput.value ? questionOptionsInput.value.split(',').map(option => option.trim()) : [];

          await veriform_backend.addQuestion(selectedSetKey, selectedPassword, questionType, questionText, options);
      }

      addQuestionForm.reset();
      await fetchAndRenderQuestions();
  } catch (error) {
      console.error('Error adding questions:', error);
  } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit All Questions';
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
addQuestionForm.addEventListener('submit', addNewQuestions);
addQuestionButton.addEventListener('click', () => {
    const newQuestionSection = createQuestionSection();
    addQuestionForm.insertBefore(newQuestionSection, addQuestionButton);
});

document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndRenderQuestions();
    const selectedSetKey = setKey;
    const selectedPassword = password;
    await displayResults(await veriform_backend.getResults(selectedSetKey, selectedPassword));
});