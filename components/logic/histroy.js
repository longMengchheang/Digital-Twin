// history.js
document.addEventListener('DOMContentLoaded', function() {
  // Enhanced mock data with conversation IDs for chat history
  const mockData = {
    chat: [
      {
        id: 'conv_001',
        title: 'Productivity Strategies',
        content: 'Discussed Pomodoro technique and task batching for better focus...',
        date: '2025-01-10',
        time: '14:30',
        conversationId: 'chat_001'
      },
      {
        id: 'conv_002',
        title: 'Mental Health Check-in',
        content: 'Talked about stress management and work-life balance...',
        date: '2025-01-08',
        time: '09:15',
        conversationId: 'chat_002'
      }
    ],
    checkin: [
      {
        id: 'check_001',
        title: 'Morning Reflection',
        content: 'Set goals for the day and reviewed weekly priorities...',
        date: '2025-01-10',
        time: '08:00'
      },
      {
        id: 'check_002',
        title: 'Evening Review',
        content: 'Reflected on today\'s achievements and areas for improvement...',
        date: '2025-01-09',
        time: '20:45'
      }
    ],
    quest: [
      {
        id: 'quest_001',
        title: 'Meditation Challenge',
        content: 'Completed 15-minute meditation session...',
        date: '2025-01-09',
        time: '07:30'
      },
      {
        id: 'quest_002',
        title: 'Reading Goal',
        content: 'Finished reading 30 pages as part of daily reading quest...',
        date: '2025-01-08',
        time: '21:00'
      }
    ]
  };

  // Format date to be more readable
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Render history entries with different classes for each type
  function renderHistoryEntries(containerId, entries, type) {
    const container = document.getElementById(containerId);
    
    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-message">No entries found</div>';
      return;
    }

    container.innerHTML = entries.map(entry => `
      <div class="history-entry ${type}-entry" data-id="${entry.id}" ${type === 'chat' ? `data-conversation="${entry.conversationId}"` : ''}>
        <div class="entry-header">
          <h3 class="entry-title">${entry.title}</h3>
          <span class="entry-time">${entry.time}</span>
        </div>
        <div class="entry-date">${formatDate(entry.date)}</div>
        <div class="entry-content">${entry.content}</div>
      </div>
    `).join('');

    // Add click handlers for chat entries
    if (type === 'chat') {
      document.querySelectorAll(`#${containerId} .chat-entry`).forEach(entry => {
        entry.addEventListener('click', function() {
          const conversationId = this.getAttribute('data-conversation');
          continueConversation(conversationId);
        });
      });
    }
  }

  // Function to handle continuing a conversation
  function continueConversation(conversationId) {
    // In a real app, this would load the conversation
    console.log(`Continuing conversation ${conversationId}`);
    alert(`Loading conversation ${conversationId}\n(In a real app, this would open the chat interface)`);
    
    // You would typically:
    // 1. Fetch the conversation history from your backend
    // 2. Open a chat interface
    // 3. Load the messages
  }

  // Initialize all history sections
  renderHistoryEntries('chat-history', mockData.chat, 'chat');
  renderHistoryEntries('checkin-history', mockData.checkin, 'checkin');
  renderHistoryEntries('quest-history', mockData.quest, 'quest');
});