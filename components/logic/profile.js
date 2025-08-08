// Profile data
const profileData = {
    name: "Kaze Arufa",
    age: 25,
    email: "kaze.arufa@example.com",
    location: "Tokyo, Japan",
    bio: "Passionate about personal growth and mindfulness. Love exploring new challenges and helping others achieve their goals.",
    level: 12,
    currentXP: 150,
    requiredXP: 200,
    dailyStreak: 886,
    totalQuests: 47,
    completedQuests: 32,
    badges: ["First Quest", "Week Warrior", "Level 10", "Streak Master"],
    avatarStage: "wise",
    joinDate: "April 2022"
};

// DOM Elements
const editButton = document.getElementById('edit-button');
const editModal = document.getElementById('edit-modal');
const cancelEdit = document.getElementById('cancel-edit');
const profileForm = document.getElementById('profile-form');
const badgesContainer = document.getElementById('badges-container');

// Form elements
const editName = document.getElementById('edit-name');
const editAge = document.getElementById('edit-age');
const editEmail = document.getElementById('edit-email');
const editLocation = document.getElementById('edit-location');
const editBio = document.getElementById('edit-bio');

// Profile display elements
const profileName = document.querySelector('#profile-info h2');
const ageDisplay = document.getElementById('age');
const emailDisplay = document.getElementById('email');
const locationDisplay = document.getElementById('location');
const bioDisplay = document.getElementById('bio');
const levelDisplay = document.getElementById('level');
const currentXPDisplay = document.getElementById('current-xp');
const requiredXPDisplay = document.getElementById('required-xp');
const progressPercentDisplay = document.getElementById('progress-percent');
const streakDisplay = document.getElementById('streak');
const completedQuestsDisplay = document.getElementById('completed-quests');
const totalQuestsDisplay = document.getElementById('total-quests');
const avatarStageDisplay = document.getElementById('avatar-stage');
const joinDateDisplay = document.getElementById('join-date');

// Initialize the profile
function initProfile() {
    // Set profile data
    document.querySelector('#profile-info h2').textContent = profileData.name;
    ageDisplay.textContent = profileData.age;
    emailDisplay.textContent = profileData.email;
    locationDisplay.textContent = profileData.location;
    bioDisplay.textContent = `"${profileData.bio}"`;
    levelDisplay.textContent = profileData.level;
    currentXPDisplay.textContent = profileData.currentXP;
    requiredXPDisplay.textContent = profileData.requiredXP;
    progressPercentDisplay.textContent = Math.round((profileData.currentXP / profileData.requiredXP) * 100);
    streakDisplay.textContent = profileData.dailyStreak;
    completedQuestsDisplay.textContent = profileData.completedQuests;
    totalQuestsDisplay.textContent = profileData.totalQuests;
    avatarStageDisplay.textContent = profileData.avatarStage;
    joinDateDisplay.textContent = profileData.joinDate;

    // Render badges
    renderBadges();
    
    // Animate level progress
    animateLevelProgress();
}

// Render badges
function renderBadges() {
    badgesContainer.innerHTML = '';
    profileData.badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge badge-secondary';
        badgeElement.textContent = badge;
        badgesContainer.appendChild(badgeElement);
    });
}

// Animate level progress circle
function animateLevelProgress() {
    const progressCircle = document.querySelector('.level-progress');
    if (progressCircle) {
        const circumference = 2 * Math.PI * 40;
        const progress = profileData.currentXP / profileData.requiredXP;
        const offset = circumference * (1 - progress);
        
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;
        
        setTimeout(() => {
            progressCircle.style.transition = 'stroke-dashoffset 1.5s ease-out';
            progressCircle.style.strokeDashoffset = offset;
        }, 100);
    }
}

// Open edit modal
function openEditModal() {
    // Fill form with current data
    editName.value = profileData.name;
    editAge.value = profileData.age;
    editEmail.value = profileData.email;
    editLocation.value = profileData.location;
    editBio.value = profileData.bio;
    
    // Show modal
    editModal.style.display = 'flex';
}

// Close edit modal
function closeEditModal() {
    editModal.style.display = 'none';
}

// Save profile changes
function saveProfile(e) {
    e.preventDefault();
    
    // Update profile data
    profileData.name = editName.value;
    profileData.age = parseInt(editAge.value);
    profileData.email = editEmail.value;
    profileData.location = editLocation.value;
    profileData.bio = editBio.value;
    
    // Update display
    document.querySelector('#profile-info h2').textContent = profileData.name;
    ageDisplay.textContent = profileData.age;
    emailDisplay.textContent = profileData.email;
    locationDisplay.textContent = profileData.location;
    bioDisplay.textContent = `"${profileData.bio}"`;
    
    // Close modal
    closeEditModal();
}

// Event listeners
editButton.addEventListener('click', openEditModal);
cancelEdit.addEventListener('click', closeEditModal);
profileForm.addEventListener('submit', saveProfile);

// Initialize the app
document.addEventListener('DOMContentLoaded', initProfile);