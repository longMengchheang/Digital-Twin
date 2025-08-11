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
    dailyQuestionEl.textContent = questions[currentQuestionIndex];
    progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    resetStars();
    createStars();
  }

  // Handle form submission
  function handleSubmit() {
    if (selectedRating === 0 || hasSubmittedAll) return;
    
    responses.push({
      question: questions[currentQuestionIndex],
      rating: selectedRating
    });
    
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      updateQuestion();
    } else {
      completeCheckIn();
    }
  }

  // Complete all questions
  function completeCheckIn() {
    hasSubmittedAll = true;
    submitButton.disabled = true;
    submitButton.textContent = "Calculating...";
    
    setTimeout(showResults, 1000);
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
    overallScoreEl.textContent = `Overall Score: ${totalScore}/25`;
    scoreProgressEl.style.width = `${percentage}%`;
    
    // Set score message
    let message = "";
    if (percentage >= 80) message = "Excellent day! You're doing amazing!";
    else if (percentage >= 60) message = "Good day! Keep up the good work!";
    else if (percentage >= 40) message = "Average day. Tomorrow can be better!";
    else message = "Challenging day. Remember, every day is a new opportunity.";
    
    scoreDetailEl.textContent = message;
    
    // Show individual responses
    responsesListEl.innerHTML = '';
    responses.forEach(response => {
      const item = document.createElement('div');
      item.className = 'response-item';
      item.innerHTML = `
        <span class="response-question">${response.question}</span>
        <span class="response-rating">${response.rating}/5</span>
      `;
      responsesListEl.appendChild(item);
    });
    
    completedMessage.style.display = 'flex';
    resultsContainer.style.display = 'flex';
    
    // Trigger confetti for good scores
    if (percentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  // Initialize the check-in
  updateQuestion();
  submitButton.addEventListener('click', handleSubmit);
}

// Make function available globally
window.initializeCheckIn = initializeCheckIn;