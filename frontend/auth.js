function loadAuthForm() {
  const authContainer = document.getElementById('auth-container');
  fetch('/auth.html')
    .then(response => {
      if (!response.ok) throw new Error(`Failed to load auth.html: ${response.status}`);
      return response.text();
    })
    .then(html => {
      authContainer.innerHTML = html;
      lucide.createIcons();
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('register-form').style.display = 'none';
    })
    .catch(error => {
      console.error('Error loading auth form:', error);
      authContainer.innerHTML = `<p>Error loading auth form. Check server logs or console.</p>`;
    });
}

function toggleAuthForm(formType) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  if (formType === 'register') {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  } else {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  }
}

function performLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const messageEl = document.getElementById('login-message');
  const authContainer = document.getElementById('auth-container');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');

  if (!email || !password) {
    messageEl.textContent = 'Email and password are required';
    messageEl.style.color = 'red';
    return;
  }

  fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      authContainer.style.display = 'none';
      sidebar.style.display = 'block';
      mainContent.style.display = 'block';
      showSection('checkin');
    } else {
      throw new Error(data.msg || 'Login failed');
    }
  })
  .catch(err => {
    console.error('Login error details:', err);
    messageEl.textContent = err.message.includes('Failed to fetch') ? 'Failed to connect to server' : err.message;
    messageEl.style.color = 'red';
  });
}

function performRegister() {
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const messageEl = document.getElementById('register-message');
  const authContainer = document.getElementById('auth-container');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');

  if (!email || !password) {
    messageEl.textContent = 'Email and password are required';
    messageEl.style.color = 'red';
    return;
  }

  fetch('http://localhost:5000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  })
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      messageEl.textContent = 'Registration successful! Logging in...';
      messageEl.style.color = 'green';
      setTimeout(() => {
        authContainer.style.display = 'none';
        sidebar.style.display = 'block';
        mainContent.style.display = 'block';
        showSection('checkin');
      }, 1000);
    } else {
      throw new Error(data.msg || 'Registration failed');
    }
  })
  .catch(err => {
    console.error('Register error details:', err);
    messageEl.textContent = err.message.includes('Failed to fetch') ? 'Failed to connect to server' : err.message;
    messageEl.style.color = 'red';
  });
}

window.loadAuthForm = loadAuthForm;
window.toggleAuthForm = toggleAuthForm;
window.showSection = showSection;
window.performLogin = performLogin;
window.performRegister = performRegister;