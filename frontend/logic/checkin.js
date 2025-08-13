// auth
function login(email, password) {
  console.log('Attempting login with:', { email, password });
  return fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    console.log('Login response status:', res.status);
    return res.json();
  })
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      initializeCheckIn();
      return { success: true, msg: 'Login successful' };
    } else {
      throw new Error(data.msg || 'Login failed');
    }
  })
  .catch(err => {
    console.error('Login error:', err.message);
    return { success: false, msg: err.message };
  });
}

// Initialize the check-in system
function initializeCheckIn() {
  // Questions array
  const questions = [
    "How are you feeling today?",
    "How productive did you feel today?", 
    "How energized are you right now?",
    "How confident are you about your goals today?",
    "How connected do you feel to others today?"
  ];


  // DOM elements
  console.log('Initializing check-in');
  const progressIndicator = document.getElementById('progress-indicator');
  const dailyQuestionEl = document.getElementById('daily-question');
  const starsContainer = document.getElementById('stars-container');
  const submitButton = document.getElementById('submit-button');
  const completedMessage = document.getElementById('completed-message');
  const resultsContainer = document.getElementById('results-container');
  const overallScoreEl = document.getElementById('overall-score');
  const scoreProgressEl = document.getElementById('score-progress');
  const scoreDetailEl = document.getElementById('score-detail');
  const responsesListEl = document.getElementById('responses-list');
  const ratingLabels = document.querySelector('.rating-labels');

  // State
  let currentQuestionIndex = 0;
  let selectedRating = 0;
  let responses = [];
  let hasSubmittedAll = false;

  async function fetchQuestions() {
    console.log('Fetching questions');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');
      const res = await fetch('http://localhost:5000/api/checkin/questions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Questions response status:', res.status, 'Response:', await res.clone().text());
      const data = await res.json();
      if (res.ok && data.questions) {
        questions = data.questions;
        updateQuestion();
      } else if (res.status === 400) {
        dailyQuestionEl.textContent = 'Daily check-in already completed today.';
        starsContainer.style.display = 'none';
        submitButton.style.display = 'none';
      } else {
        throw new Error(data.msg || 'Failed to fetch questions');
      }
    } catch (err) {
      console.error('Fetch questions error:', err.message);
      dailyQuestionEl.textContent = 'Error loading questions. Please try again or check server.';
    }
  }

  // Create star rating elements
  function createStars() {
    starsContainer.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
      const starButton = document.createElement('button');
      starButton.className = 'star-button';
      starButton.innerHTML = `<i class="star-icon" data-lucide="star"></i>`;
      starButton.dataset.rating = i;

      // Highlight if this star is part of the selected rating
      if (i <= selectedRating) {
        starButton.querySelector('.star-icon').classList.add('filled');
      }
      starsContainer.appendChild(starButton);
    }

    // Use event delegation for better performance
    starsContainer.addEventListener('click', handleStarClick);
    lucide.createIcons();
  }

  // Handle star clicks
  function handleStarClick(e) {
    if (hasSubmittedAll) return;

    const starButton = e.target.closest('.star-button');
    if (!starButton) return;

    selectedRating = parseInt(starButton.dataset.rating);
    submitButton.disabled = false;

    // Update star visuals
    const stars = starsContainer.querySelectorAll('.star-icon');
    stars.forEach((star, index) => {
      star.classList.toggle('filled', index < selectedRating);
    });

  }

  // Reset stars for new question
  function resetStars() {
    selectedRating = 0;
    const stars = starsContainer.querySelectorAll('.star-icon');
    stars.forEach(star => star.classList.remove('filled'));
    submitButton.disabled = true;
  }

  // Update question display
  function updateQuestion() {
    if (currentQuestionIndex < questions.length) {
      dailyQuestionEl.textContent = questions[currentQuestionIndex];
      progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
      resetStars();
      createStars();
    }
  }

  // Handle form submission
  async function handleSubmit() {
    if (selectedRating === 0 || hasSubmittedAll) return;

    responses.push({ 
       question: questions[currentQuestionIndex],
       rating: selectedRating 
      });

    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      updateQuestion();
    } else {
      await completeCheckIn();
    }
  }

   // Complete all questions
  async function completeCheckIn() {
    hasSubmittedAll = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Calculating...';


    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await fetch('http://localhost:5000/api/checkin/submit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: responses.map(r => r.rating) })
      });

      console.log('Submit response status:', res.status);
      const data = await res.json();

      if (res.ok && data.msg === 'Check-in submitted') {
        setTimeout(showResults, 1000);
      } 
      else {
        throw new Error(data.msg || 'Submission failed');
      }
    } catch (err) {
      console.error('Submit error:', err.message);
      alert('Failed to submit check-in. Check token or server.');

      hasSubmittedAll = false;
      submitButton.textContent = 'Submit';
    }
  }

  // Show final results
  function showResults() {
    const totalScore = responses.reduce((sum, response) => sum + response.rating, 0);
    const maxScore = questions.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Hide question elements
    progressIndicator.style.display = 'none';
    dailyQuestionEl.style.display = 'none';
    starsContainer.style.display = 'none';
    ratingLabels.style.display = 'none';
    submitButton.style.display = 'none';

    // Show results
    overallScoreEl.textContent = `Overall Score: ${totalScore}/${maxScore}`;
    scoreProgressEl.style.width = `${percentage}%`;

    // Set score message
    let message = '';
    if (percentage >= 80) message = 'Excellent day! You\'re doing amazing!';
    else if (percentage >= 60) message = 'Good day! Keep up the good work!';
    else if (percentage >= 40) message = 'Average day. Tomorrow can be better!';
    else message = 'Challenging day. Remember, every day is a new opportunity.';

    scoreDetailEl.textContent = message;
    
    // Show individual responses
    responsesListEl.innerHTML = '';
    responses.forEach(response => {
      const item = document.createElement('div');
      item.className = 'response-item';
      item.innerHTML = `<span class="response-question">${response.question}</span>
      <span class="response-rating">${response.rating}/5</span>`;
      responsesListEl.appendChild(item);
    });

    completedMessage.style.display = 'flex';
    resultsContainer.style.display = 'flex';

    // Trigger confetti for good scores
    if (percentage >= 70) {
      confetti({ particleCount: 100,
        spread: 70,
        origin: { y: 0.6 } });
    }
  }

  // Initialize the check-in
  updateQuestion();
  submitButton.addEventListener('click', handleSubmit);
}

window.login = login;
window.initializeCheckIn = initializeCheckIn;