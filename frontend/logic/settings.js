function initializeSettings() {
  console.log('Initializing settings...');
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <h2>Settings</h2>
      <p>Customize your experience here!</p>
    `;
  } else {
    console.error('Main content element not found');
  }
}

window.initializeSettings = initializeSettings;