// Global state for quests
let quests = [];
let questConfettiInstance; // ✅ global confetti instance

console.log('quest.js loaded');

// Setup confetti canvas (only once)
function setupQuestConfetti() {
  if (questConfettiInstance) return; // already exists

  const canvas = document.createElement('canvas');
  canvas.id = 'quest-confetti-canvas';
  document.body.appendChild(canvas);

  // Style the canvas to overlay everything
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '2000';
  canvas.style.pointerEvents = 'none';

  questConfettiInstance = confetti.create(canvas, {
    resize: true,
    useWorker: true
  });
}

// 🎉 helper to fire quest confetti
function fireQuestConfetti() {
  setupQuestConfetti();
  questConfettiInstance({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 }
  });
}

// Initialize quest functionality
function initializeQuests() {
  console.log('Initializing quests...');
  refreshQuests();

  const questForm = document.getElementById('quest-form');
  if (!questForm) {
    console.error('Quest form not found');
    return;
  }
  questForm.addEventListener('submit', function(e) {
    e.preventDefault();
    handleQuestSubmit(e);
  });

  const questGoal = document.getElementById('quest-goal');
  if (!questGoal) {
    console.error('Quest goal input not found');
    return;
  }
  questGoal.addEventListener('input', updateGoalLength);
  updateGoalLength();

  const questDuration = document.getElementById('quest-duration');
  if (!questDuration) {
    console.error('Quest duration select not found');
    return;
  }
  questDuration.addEventListener('change', updateDurationDisplay);
  updateDurationDisplay();
}

// Fetch quests from backend
async function fetchQuests() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/quest/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      quests = data.map(quest => ({
        id: quest._id,
        duration: quest.duration,
        goal: quest.goal,
        progress: quest.ratings[0] || 0,
        completed: quest.completed,
        createdAt: quest.date
      }));
      console.log('Fetched quests:', quests);
      renderQuests();
      renderAchievements();
    } else {
      console.error('Failed to fetch quests:', data.msg);
      document.getElementById('active-quests-list').innerHTML = '<div class="empty-state">Failed to load quests.</div>';
    }
  } catch (err) {
    console.error('Fetch quests error:', err);
    document.getElementById('active-quests-list').innerHTML = '<div class="empty-state">Error loading quests.</div>';
  }
}

// Refresh quests when section is shown
function refreshQuests() {
  fetchQuests();
}

// Save quests to backend (create new quest)
async function saveQuests(quest) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/api/quest/create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(quest)
    });
    const data = await res.json();
    if (res.ok) {
      quests.push({ id: data.quest._id, ...quest, progress: 0, completed: false, createdAt: new Date() });
      console.log('Quest created:', data.quest);
      renderQuests();
      renderAchievements();
    } else {
      showToast('Error', data.msg || 'Failed to create quest.', 'error');
    }
  } catch (err) {
    console.error('Save quests error:', err);
    showToast('Error', 'Server error during creation.', 'error');
  }
}

// Show toast notification
function showToast(title, message, type = 'success') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-message">${message}</div>
  `;

  toastContainer.appendChild(toast);

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
async function updateQuestProgress(questId, progress) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/quest/progress/${questId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: Math.min(Math.max(progress, 0), 100) })
    });
    const data = await res.json();
    if (res.ok) {
      quests = quests.map(quest => {
        if (quest.id === questId) {
          const newProgress = data.quest.ratings[0];
          const completed = newProgress >= 100;
          const updatedQuest = { ...quest, progress: newProgress, completed };
          if (completed && !quest.completedDate) {
            updatedQuest.completedDate = new Date().toISOString();
            showToast('Quest Completed!', 'Congratulations on completing your quest!');
            fireQuestConfetti(); // ✅ use overlay confetti
          }
          if (!completed && quest.completedDate) {
            delete updatedQuest.completedDate;
          }
          return updatedQuest;
        }
        return quest;
      });
      renderQuests();
      renderAchievements();
    } else {
      showToast('Error', data.msg || 'Failed to update progress.', 'error');
    }
  } catch (err) {
    console.error('Update progress error:', err);
    showToast('Error', 'Server error during progress update.', 'error');
  }
}

// Toggle quest completion
async function toggleQuestCompletion(questId) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/quest/complete/${questId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      quests = quests.map(quest => {
        if (quest.id === questId) {
          const newProgress = data.quest.ratings[0];
          const completed = newProgress >= 100;
          const updatedQuest = { ...quest, progress: newProgress, completed };
          if (completed && !quest.completedDate) {
            updatedQuest.completedDate = new Date().toISOString();
            showToast('Quest Completed!', 'Congratulations on completing your quest!');
            fireQuestConfetti(); // ✅ use overlay confetti
          }
          if (!completed && quest.completedDate) {
            delete updatedQuest.completedDate;
          }
          return updatedQuest;
        }
        return quest;
      });
      renderQuests();
      renderAchievements();
    } else {
      showToast('Error', data.msg || 'Failed to toggle completion.', 'error');
    }
  } catch (err) {
    console.error('Toggle completion error:', err);
    showToast('Error', 'Server error during completion toggle.', 'error');
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

  saveQuests({ goal, duration });

  // Reset form
  document.getElementById('quest-goal').value = '';
  document.getElementById('quest-duration').value = 'Daily';
  updateDurationDisplay();
  updateGoalLength();

  showToast('Quest Created!', `Your ${duration.toLowerCase()} quest has been added.`);
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

  if (!activeQuestsList || !activeQuestsCount) return;

  const activeQuests = quests.filter(quest => !quest.completed);

  // console.log('Rendering quests:', activeQuests);
  activeQuestsCount.textContent = `${activeQuests.length} Active`;

  if (activeQuests.length === 0) {
    activeQuestsList.innerHTML = `
      <div class="empty-state">
        No active quests. Create a new quest below!
      </div>
    `;
    return;
  }

  // Clear empty state if present
  if (activeQuestsList.querySelector('.empty-state')) {
      activeQuestsList.innerHTML = '';
  }

  const existingElements = new Map();
  Array.from(activeQuestsList.children).forEach(child => {
      if (child.dataset.questId) {
          existingElements.set(child.dataset.questId, child);
      }
  });

  let hasNewElements = false;

  activeQuests.forEach((quest, index) => {
    let questEl = existingElements.get(quest.id);
    const durationDetails = getDurationDetails(quest.duration);
    const formattedDate = formatDate(quest.createdAt);
    const isCompleted = quest.completed;

    if (questEl) {
        // Update existing element
        if (questEl.classList.contains('completed') !== isCompleted) {
            questEl.classList.toggle('completed', isCompleted);
        }

        let goalEl = questEl.children[1];
        if (!goalEl || !goalEl.classList.contains('quest-goal')) {
             goalEl = questEl.querySelector('.quest-goal');
        }
        if (goalEl) {
             if (goalEl.textContent.trim() !== quest.goal) goalEl.textContent = quest.goal;
             goalEl.classList.toggle('completed', isCompleted);
        }

        // Optimized access for progress info: children[2] -> children[0] -> children[1]
        let progressContainer = questEl.children[2];
        let progressInfo = null;
        let progressFill = null;

        if (progressContainer && progressContainer.classList.contains('progress-container')) {
             const infoDiv = progressContainer.children[0];
             if (infoDiv) progressInfo = infoDiv.children[1];

             const barDiv = progressContainer.children[1];
             if (barDiv) progressFill = barDiv.children[0];
        } else {
             // Fallback
             progressInfo = questEl.querySelector('.progress-info span:last-child');
             progressFill = questEl.querySelector('.progress-fill');
        }

        if (progressInfo && progressInfo.textContent !== `${quest.progress}%`) {
            progressInfo.textContent = `${quest.progress}%`;
        }

        if (progressFill) {
            if (progressFill.style.width !== `${quest.progress}%`) {
                progressFill.style.width = `${quest.progress}%`;
            }
            const newClass = `progress-fill ${durationDetails.colorClass}`;
            if (progressFill.className !== newClass) {
                 progressFill.className = newClass;
            }
        }

        // Update actions (attributes)
        let actionsContainer = questEl.children[3];
        let actionBtns = [];
        let completeBtn = null;

        if (actionsContainer && actionsContainer.classList.contains('quest-actions')) {
             const btnsDiv = actionsContainer.children[0];
             if (btnsDiv) actionBtns = btnsDiv.children;
             completeBtn = actionsContainer.children[1];
        } else {
             actionBtns = questEl.querySelectorAll('.action-btn');
             completeBtn = questEl.querySelector('.complete-btn');
        }

        if (actionBtns.length >= 2) {
             const onclick1 = `window.updateQuestProgress('${quest.id}', ${quest.progress + 25})`;
             if (actionBtns[0].getAttribute('onclick') !== onclick1) {
                 actionBtns[0].setAttribute('onclick', onclick1);
             }
             const onclick2 = `window.updateQuestProgress('${quest.id}', ${quest.progress + 50})`;
             if (actionBtns[1].getAttribute('onclick') !== onclick2) {
                 actionBtns[1].setAttribute('onclick', onclick2);
             }
        }

        if (completeBtn) {
            if (completeBtn.classList.contains('completed') !== isCompleted) {
                completeBtn.classList.toggle('completed', isCompleted);
            }
            const onclickComplete = `window.toggleQuestCompletion('${quest.id}')`;
            if (completeBtn.getAttribute('onclick') !== onclickComplete) {
                completeBtn.setAttribute('onclick', onclickComplete);
            }
            const btnText = isCompleted ? 'Undo' : 'Complete';
            if (completeBtn.lastChild && completeBtn.lastChild.nodeType === Node.TEXT_NODE) {
                if (completeBtn.lastChild.textContent.trim() !== btnText) {
                    completeBtn.lastChild.textContent = ` ${btnText}`;
                }
            } else {
                 completeBtn.innerHTML = `<i data-lucide="check"></i> ${btnText}`;
            }
        }
    } else {
        // Create new element
        hasNewElements = true;
        questEl = document.createElement('div');
        questEl.className = `quest-item ${isCompleted ? 'completed' : ''}`;
        questEl.dataset.questId = quest.id;
        questEl.innerHTML = `
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

        <div class="quest-goal ${isCompleted ? 'completed' : ''}">
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
                    onclick="window.updateQuestProgress('${quest.id}', ${quest.progress + 25})">
              +25%
            </button>
            <button class="action-btn"
                    onclick="window.updateQuestProgress('${quest.id}', ${quest.progress + 50})">
              +50%
            </button>
          </div>

          <button class="complete-btn ${isCompleted ? 'completed' : ''}"
                  onclick="window.toggleQuestCompletion('${quest.id}')">
            <i data-lucide="check"></i>
            ${isCompleted ? 'Undo' : 'Complete'}
          </button>
        </div>
        `;
    }

    // Place element in correct position
    const currentChild = activeQuestsList.children[index];
    if (currentChild !== questEl) {
        if (currentChild) {
            activeQuestsList.insertBefore(questEl, currentChild);
        } else {
            activeQuestsList.appendChild(questEl);
        }
    }
  });

  // Remove excess elements
  while (activeQuestsList.children.length > activeQuests.length) {
      activeQuestsList.lastChild.remove();
  }

  if (hasNewElements) {
    lucide.createIcons();
    setTimeout(() => lucide.createIcons(), 50);
  }
}

// Update achievements display
function renderAchievements() {
  const completedQuests = quests.filter(quest => quest.completed);
  const achievementsSections = document.getElementById('achievements-sections');
  const achievementsCount = document.getElementById('achievements-count');

  if (!achievementsSections || !achievementsCount) return;

  console.log('Rendering achievements:', completedQuests);
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

  lucide.createIcons();
  setTimeout(() => lucide.createIcons(), 50);
}

// Make functions available globally
window.initializeQuests = initializeQuests;
window.updateQuestProgress = updateQuestProgress;
window.toggleQuestCompletion = toggleQuestCompletion;
