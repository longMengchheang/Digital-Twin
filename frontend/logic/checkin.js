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
  let questions = [
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
  let confettiInstance = null;

  // Setup confetti canvas once
  function setupConfetti() {
    if (document.getElementById('confetti-canvas')) return; // already exists
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);

    // Style it to be on top
    Object.assign(canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '2000',
      pointerEvents: 'none'
    });

    // create confetti instance
    confettiInstance = confetti.create(canvas, { resize: true, useWorker: true });
  }
  setupConfetti();

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
      if (i <= selectedRating) {
        starButton.querySelector('.star-icon').classList.add('filled');
      }
      starsContainer.appendChild(starButton);
    }
    starsContainer.addEventListener('click', handleStarClick);
    lucide.createIcons();
  }

  function handleStarClick(e) {
    if (hasSubmittedAll) return;
    const starButton = e.target.closest('.star-button');
    if (!starButton) return;
    selectedRating = parseInt(starButton.dataset.rating);
    submitButton.disabled = false;
    const stars = starsContainer.querySelectorAll('.star-icon');
    stars.forEach((star, index) => {
      star.classList.toggle('filled', index < selectedRating);
    });
  }

  function resetStars() {
    selectedRating = 0;
    const stars = starsContainer.querySelectorAll('.star-icon');
    stars.forEach(star => star.classList.remove('filled'));
    submitButton.disabled = true;
  }

  function updateQuestion() {
    if (currentQuestionIndex < questions.length) {
      dailyQuestionEl.textContent = questions[currentQuestionIndex];
      progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
      resetStars();
      createStars();
    }
  }

  async function handleSubmit() {
    if (selectedRating === 0 || hasSubmittedAll) return;
    responses.push({ question: questions[currentQuestionIndex], rating: selectedRating });
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      updateQuestion();
    } else {
      await completeCheckIn();
    }
  }

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
      } else {
        throw new Error(data.msg || 'Submission failed');
      }
    } catch (err) {
      console.error('Submit error:', err.message);
      alert('Failed to submit check-in. Check token or server.');
      hasSubmittedAll = false;
      submitButton.textContent = 'Submit';
    }
  }

  function showResults() {
    const totalScore = responses.reduce((sum, r) => sum + r.rating, 0);
    const maxScore = questions.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);

    progressIndicator.style.display = 'none';
    dailyQuestionEl.style.display = 'none';
    starsContainer.style.display = 'none';
    ratingLabels.style.display = 'none';
    submitButton.style.display = 'none';

    overallScoreEl.textContent = `Overall Score: ${totalScore}/${maxScore}`;
    scoreProgressEl.style.width = `${percentage}%`;

    let message = '';
    if (percentage >= 80) message = 'Excellent day! You\'re doing amazing!';
    else if (percentage >= 60) message = 'Good day! Keep up the good work!';
    else if (percentage >= 40) message = 'Average day. Tomorrow can be better!';
    else message = 'Challenging day. Remember, every day is a new opportunity.';

    scoreDetailEl.textContent = message;
    
    responsesListEl.innerHTML = '';
    responses.forEach(r => {
      const item = document.createElement('div');
      item.className = 'response-item';
      item.innerHTML = `<span class="response-question">${r.question}</span>
                        <span class="response-rating">${r.rating}/5</span>`;
      responsesListEl.appendChild(item);
    });

    completedMessage.style.display = 'flex';
    resultsContainer.style.display = 'flex';

    // 🎉 Confetti trigger
    if (percentage >= 70 && confettiInstance) {
      confettiInstance({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }

  // Start
  updateQuestion();
  submitButton.addEventListener('click', handleSubmit);
}

window.login = login;
window.initializeCheckIn = initializeCheckIn;
