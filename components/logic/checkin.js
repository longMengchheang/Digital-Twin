document.addEventListener('DOMContentLoaded', function() {
  // Initialize Lucide icons first
  lucide.createIcons();
  
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

  // State
  let currentQuestionIndex = 0;
  let selectedRating = 0;
  let responses = [];
  let hasSubmittedAll = false;

  // Create star rating elements
  function createStars() {
    starsContainer.innerHTML = ''; // Clear existing stars
    
    for (let i = 1; i <= 5; i++) {
      const starButton = document.createElement('button');
      starButton.className = 'star-button';
      starButton.innerHTML = `<i class="star-icon" data-lucide="star"></i>`;
      starButton.addEventListener('click', () => selectRating(i));
      
      starsContainer.appendChild(starButton);
    }
    
    // Refresh icons after creation
    lucide.createIcons();
  }

  // Select rating
  function selectRating(rating) {
    if (hasSubmittedAll) return;
    
    selectedRating = rating;
    submitButton.disabled = false;
    
    // Highlight selected stars
    const stars = starsContainer.querySelectorAll('.star-icon');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('filled');
      } else {
        star.classList.remove('filled');
      }
    });
  }

  // Reset stars
  function resetStars() {
    selectedRating = 0;
    const stars = starsContainer.querySelectorAll('.star-icon');
    stars.forEach(star => {
      star.classList.remove('filled');
    });
    submitButton.disabled = true;
  }

  // Update question display
  function updateQuestion() {
    dailyQuestionEl.textContent = questions[currentQuestionIndex];
    progressIndicator.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    resetStars();
    createStars(); // Recreate stars for new question
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

  // Show results
  function showResults() {
    const totalScore = responses.reduce((sum, response) => sum + response.rating, 0);
    const maxScore = questions.length * 5;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    // Hide question elements
    progressIndicator.style.display = 'none';
    dailyQuestionEl.style.display = 'none';
    starsContainer.style.display = 'none';
    document.querySelector('.rating-labels').style.display = 'none';
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
    
    // Refresh icons
    lucide.createIcons();
  }

  // Initialize
  updateQuestion();
  submitButton.addEventListener('click', handleSubmit);
});