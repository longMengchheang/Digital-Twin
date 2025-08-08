// Global state for quests
let quests = [];

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Load quests from localStorage
  loadQuests();
  
  // Set up event listeners
  document.getElementById('quest-form').addEventListener('submit', handleQuestSubmit);
  document.getElementById('quest-goal').addEventListener('input', updateGoalLength);
  document.getElementById('quest-duration').addEventListener('change', updateDurationDisplay);
});

// Load quests from localStorage
function loadQuests() {
  const savedQuests = localStorage.getItem('quests');
  if (savedQuests) {
    quests = JSON.parse(savedQuests);
    renderQuests();
    renderAchievements();
  }
}

// Save quests to localStorage
function saveQuests() {
  localStorage.setItem('quests', JSON.stringify(quests));
}

// Show toast notification
function showToast(title, message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-message">${message}</div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Get duration details
function getDurationDetails(duration) {
  const details = {
    icon: 'target',
    colorClass: '',
    iconName: 'target'
  };
  
  switch (duration.toLowerCase()) {
    case 'daily':
      details.icon = 'calendar';
      details.colorClass = 'duration-daily';
      details.iconName = 'calendar';
      break;
    case 'weekly':
      details.icon = 'clock';
      details.colorClass = 'duration-weekly';
      details.iconName = 'clock';
      break;
    case 'monthly':
      details.icon = 'target';
      details.colorClass = 'duration-monthly';
      details.iconName = 'target';
      break;
    case 'yearly':
      details.icon = 'trophy';
      details.colorClass = 'duration-yearly';
      details.iconName = 'trophy';
      break;
  }
  
  return details;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Update quest progress
function updateQuestProgress(questId, progress) {
  quests = quests.map(quest => {
    if (quest.id === questId) {
      const newProgress = Math.min(Math.max(progress, 0), 100);
      const completed = newProgress >= 100;
      const updatedQuest = { ...quest, progress: newProgress, completed };
      
      // Add completion date if just completed
      if (completed && !quest.completedDate) {
        updatedQuest.completedDate = new Date().toISOString();
      }
      
      // Remove completion date if un-completed
      if (!completed && quest.completedDate) {
        delete updatedQuest.completedDate;
      }
      
      return updatedQuest;
    }
    return quest;
  });
  
  saveQuests();
  renderQuests();
  renderAchievements();
  
  if (progress >= 100) {
    showToast('Quest Completed!', 'Congratulations on completing your quest!');
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
}

// Toggle quest completion
function toggleQuestCompletion(questId) {
  const quest = quests.find(q => q.id === questId);
  if (quest) {
    const newProgress = quest.completed ? 0 : 100;
    updateQuestProgress(questId, newProgress);
  }
}

// Handle quest form submission
function handleQuestSubmit(e) {
  e.preventDefault();
  const duration = document.getElementById('quest-duration').value;
  const goal = document.getElementById('quest-goal').value.trim();
  
  if (!goal) {
    showToast('Error', 'Please enter a goal for your quest.', 'error');
    return;
  }
  
  // Show confirmation dialog before creating quest
  const confirmed = confirm(`Are you sure you want to create this ${duration.toLowerCase()} quest?\n\n"${goal}"\n\nRemember: Quests cannot be deleted once created.`);
  
  if (!confirmed) {
    return;
  }
  
  const newQuest = {
    id: Date.now().toString(),
    duration: duration.toLowerCase(),
    goal,
    progress: 0,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  quests = [...quests, newQuest];
  saveQuests();
  
  // Reset form
  document.getElementById('quest-goal').value = '';
  document.getElementById('quest-duration').value = 'Daily';
  updateDurationDisplay();
  updateGoalLength();
  
  showToast('Quest Created!', `Your ${duration.toLowerCase()} quest has been added.`);
  renderQuests();
}

// Update character count for goal input
function updateGoalLength() {
  const goalInput = document.getElementById('quest-goal');
  if (goalInput) {
    document.getElementById('goal-length').textContent = goalInput.value.length;
  }
}

// Update duration display when selection changes
function updateDurationDisplay() {
  const durationSelect = document.getElementById('quest-duration');
  const durationDisplay = document.getElementById('duration-display');
  if (durationSelect && durationDisplay) {
    const duration = durationSelect.value.toLowerCase();
    durationDisplay.textContent = duration;
    durationDisplay.className = `duration-${duration}`;
  }
}

// Render all quests (active and completed)
function renderQuests() {
  const activeQuestsList = document.getElementById('active-quests-list');
  const activeQuestsCount = document.getElementById('active-quests-count');
  
  const activeQuests = quests.filter(quest => !quest.completed);
  const completedQuests = quests.filter(quest => quest.completed);
  
  activeQuestsCount.textContent = `${activeQuests.length} Active`;
  
  if (activeQuests.length === 0) {
    activeQuestsList.innerHTML = `
      <div class="empty-state">
        No active quests. Create a new quest below!
      </div>
    `;
    return;
  }
  
  activeQuestsList.innerHTML = activeQuests.map(quest => {
    const durationDetails = getDurationDetails(quest.duration);
    const formattedDate = formatDate(quest.createdAt);
    
    return `
      <div class="quest-item">
        <div class="quest-header">
          <div class="quest-type">
            <div class="icon-container ${durationDetails.colorClass}">
              <i data-lucide="${durationDetails.icon}"></i>
            </div>
            <span class="${durationDetails.colorClass}">
              ${quest.duration.charAt(0).toUpperCase() + quest.duration.slice(1)}
            </span>
          </div>
          <div class="quest-date">${formattedDate}</div>
        </div>
        
        <div class="quest-goal">
          ${quest.goal}
        </div>
        
        <div class="progress-container">
          <div class="progress-info">
            <span>Progress</span>
            <span>${quest.progress}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${durationDetails.colorClass}" 
                 style="width: ${quest.progress}%"></div>
          </div>
        </div>
        
        <div class="quest-actions">
          <div class="action-buttons">
            <button class="action-btn" 
                    onclick="updateQuestProgress('${quest.id}', ${quest.progress + 25})">
              +25%
            </button>
            <button class="action-btn" 
                    onclick="updateQuestProgress('${quest.id}', ${quest.progress + 50})">
              +50%
            </button>
          </div>
          
          <button class="complete-btn" 
                  onclick="toggleQuestCompletion('${quest.id}')">
            <i data-lucide="check"></i>
            Complete
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Refresh Lucide icons after rendering
  lucide.createIcons();
}

// Update achievements display
function renderAchievements() {
  const completedQuests = quests.filter(quest => quest.completed);
  const achievementsSections = document.getElementById('achievements-sections');
  const achievementsCount = document.getElementById('achievements-count');
  
  achievementsCount.textContent = `${completedQuests.length} Completed`;
  
  if (completedQuests.length === 0) {
    achievementsSections.innerHTML = `
      <div class="empty-achievements">
        No achievements yet. Complete some quests to see them here!
      </div>
    `;
    return;
  }
  
  // Group achievements by duration type
  const achievementsByDuration = {
    daily: completedQuests.filter(q => q.duration === 'daily'),
    weekly: completedQuests.filter(q => q.duration === 'weekly'),
    monthly: completedQuests.filter(q => q.duration === 'monthly'),
    yearly: completedQuests.filter(q => q.duration === 'yearly')
  };
  
  let sectionsHTML = '';
  
  // Create sections for each duration type that has achievements
  for (const [duration, questsList] of Object.entries(achievementsByDuration)) {
    if (questsList.length > 0) {
      const durationDetails = getDurationDetails(duration);
      
      sectionsHTML += `
        <div class="achievement-section">
          <h4 class="achievement-section-title">
            <i data-lucide="${durationDetails.iconName}"></i>
            ${duration.charAt(0).toUpperCase() + duration.slice(1)} Quests
            <span class="count-badge">${questsList.length}</span>
          </h4>
          <div class="achievements-grid">
            ${questsList.map(quest => {
              const formattedDate = formatDate(quest.createdAt);
              const completedDate = quest.completedDate ? formatDate(quest.completedDate) : 'Recently';
              
              return `
                <div class="achievement-card">
                  <div class="achievement-goal">${quest.goal}</div>
                  <div class="achievement-date">Completed: ${completedDate}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  }
  
  achievementsSections.innerHTML = sectionsHTML;
  
  // Refresh Lucide icons after rendering
  lucide.createIcons();
}

// Make functions available globally
window.updateQuestProgress = updateQuestProgress;
window.toggleQuestCompletion = toggleQuestCompletion;