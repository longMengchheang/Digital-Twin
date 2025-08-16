function initializeHistory() {
  console.log('Initializing history...');
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <h1>Recent Chats</h1>
      <p>Select a chat to view details...</p>
      <div class="settings-button" onclick="showSection('settings')">
        <i data-lucide="settings" style="color: hsl(84 81% 44%); font-size: 24px;"></i>
      </div>
    `;
    lucide.createIcons();
  } else {
    console.error('Main content element not found');
  }
}

window.initializeHistory = initializeHistory;