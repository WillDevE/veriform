// index.js
const questionsDiv = document.getElementById('questions');
const resultsDiv = document.getElementById('results');
const submitButton = document.getElementById('submit-answers');
const resetButton = document.getElementById('reset');

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
import { poll_backend } from "../../declarations/poll_backend";

// Array of questions with their types and options (if applicable)
const questions = [
    {
        type: 'text',
        text: "What is your favorite game?"
    },
    {
        type: 'radio',
        text: "What is your favorite color?",
        options: ['Red', 'Green', 'Blue', 'Other']
    },
    {
        type: 'checkbox',
        text: "What are your favorite programming languages?",
        options: ['JavaScript', 'Python', 'Java', 'C++', 'Ruby']
    },
    {
        type: 'paragraph',
        text: "Write a short paragraph about your dream vacation."
    },
    {
        type: 'dropdown',
        text: "What is your favorite food?",
        options: ['Pizza', 'Sushi', 'Burger', 'Salad']
    },
    {
        type: 'linearScale',
        text: "Rate your experience with our product from 1 to 5.",
        minLabel: "Poor",
        maxLabel: "Excellent"
    }
];

// Dynamically add questions to the DOM
questions.forEach((question, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question-container');

    // If the question type is 'text', render a text input field
    if (question.type === 'text') {
        questionDiv.innerHTML = `
            <h3>${index + 1}. ${question.text}</h3>
            <input type="text" id="answer-${index}" placeholder="Enter your answer">
        `;
    } else if (question.type === 'radio') {
        // If the question type is 'radio', render radio buttons with options
        questionDiv.innerHTML = `
            <h3>${index + 1}. ${question.text}</h3>
            ${question.options.map((option, optionIndex) => `
                <label>
                    <input type="radio" name="question-${index}" value="${option}" ${optionIndex === question.options.length - 1 ? 'data-other="true"' : ''}>
                    ${option}
                </label>
            `).join('')}
            <div class="other-option-input" style="display: none;">
                <input type="text" id="other-answer-${index}" placeholder="Enter your answer">
            </div>
        `;
    } else if (question.type === 'checkbox') {
        // If the question type is 'checkbox', render checkboxes with options
        questionDiv.innerHTML = `
            <h3>${index + 1}. ${question.text}</h3>
            ${question.options.map((option, optionIndex) => `
                <label>
                    <input type="checkbox" name="question-${index}" value="${option}">
                    ${option}
                </label>
            `).join('')}
        `;
    } else if (question.type === 'paragraph') {
        questionDiv.innerHTML = `
            <h3>${index + 1}. ${question.text}</h3>
            <textarea id="answer-${index}" placeholder="Enter your answer"></textarea>
        `;
    } else if (question.type === 'dropdown') {
        questionDiv.innerHTML = `
            <h3>${index + 1}. ${question.text}</h3>
            <select id="answer-${index}">
                ${question.options.map((option) => `<option value="${option}">${option}</option>`).join('')}
            </select>
        `;
    } else if (question.type === 'linearScale') {
        questionDiv.innerHTML = `
            <h3>${index + 1}. ${question.text}</h3>
            <div class="linear-scale">
                <span>${question.minLabel}</span>
                ${Array.from({ length: 5 }, (_, i) => `<input type="radio" name="question-${index}" value="${i + 1}">`)
                    .join('')}
                <span>${question.maxLabel}</span>
            </div>
        `;
    }

    questionsDiv.appendChild(questionDiv);
});

// Add event listeners for radio buttons
const radioInputs = document.querySelectorAll('input[type="radio"]');
radioInputs.forEach((radioInput) => {
    radioInput.addEventListener('change', () => {
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
    });
});

// Handle submit button click
submitButton.addEventListener('click', async () => {
    if (!submitButton.disabled) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-icon">&#8635;</span> Submitting...';

        const answers = [];

        // Loop through questions and collect user answers
        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            let answer = '';

            if (question.type === 'text') {
                const textInput = document.querySelector(`#answer-${i}`);
                answer = textInput.value.trim();
            } else if (question.type === 'radio') {
                const selectedRadio = document.querySelector(`input[name="question-${i}"]:checked`);
                answer = selectedRadio ? selectedRadio.value : '';

                // If the 'Other' option is selected, get the value from the text input
                if (answer === 'Other') {
                    const otherInput = document.querySelector(`#other-answer-${i}`);
                    answer = otherInput.value.trim();
                }
            } else if (question.type === 'checkbox') {
                const selectedCheckboxes = Array.from(document.querySelectorAll(`input[name="question-${i}"]:checked`));
                answer = selectedCheckboxes.map(checkbox => checkbox.value).join(', ');
            } else if (question.type === 'paragraph') {
                const textArea = document.querySelector(`#answer-${i}`);
                answer = textArea.value.trim();
            } else if (question.type === 'dropdown') {
                const dropdown = document.querySelector(`#answer-${i}`);
                answer = dropdown.value;
            } else if (question.type === 'linearScale') {
                const selectedRadio = document.querySelector(`input[name="question-${i}"]:checked`);
                answer = selectedRadio ? selectedRadio.value : '';
            }

            // Add the question and answer to the answers array if an answer is provided
            if (answer) {
                answers.push([question.text, answer]);
            }
        }

        // Add all answers to the backend at once
        await poll_backend.addAnswers(answers);

        // Get the updated results from the backend and display them
        const results = await poll_backend.getResults();
        displayResults(results);

        submitButton.disabled = false;
        submitButton.innerHTML = 'Submit Answers';
    }
});

// Display the poll results
function displayResults(results) {
    resultsDiv.innerHTML = '';
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.innerHTML = `<h3>${index + 1}. ${question.text}</h3>`;
        const answersDiv = document.createElement('div');

        // Find the corresponding question and answers in the results
        const questionAnswers = results.find(([questionText]) => questionText === question.text);
        if (questionAnswers) {
            const [_, answers] = questionAnswers;
            answers.forEach(([answer, count]) => {
                const answerDiv = document.createElement('div');
                if (question.type === 'checkbox' || question.type === 'checkboxGrid') {
                    // Split the answer by comma and display each option separately
                    const options = answer.split(', ');
                    answerDiv.textContent = `- ${options.join(', ')}: ${count}`;
                } else {
                    answerDiv.textContent = `- ${answer}: ${count}`;
                }
                answersDiv.appendChild(answerDiv);
            });
        }

        questionDiv.appendChild(answersDiv);
        resultsDiv.appendChild(questionDiv);
    });
}

// Load initial results from the backend
document.addEventListener('DOMContentLoaded', async () => {
    const results = await poll_backend.getResults();
    displayResults(results);
});

// Reset the poll data
resetButton.addEventListener('click', async () => {
    await poll_backend.clearData();
    displayResults([]);
}); 