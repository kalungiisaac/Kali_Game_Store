/**
 * Registration Module
 * Handles user registration and login functionality
 */

class Register {
  constructor() {
    this.registeredUsers = this.loadUsers();
    this.currentUser = this.loadCurrentUser();
  }

  /**
   * Load registered users from localStorage
   */
  loadUsers() {
    const users = localStorage.getItem('gameLibrary_users');
    return users ? JSON.parse(users) : {};
  }

  /**
   * Load currently logged-in user from localStorage
   */
  loadCurrentUser() {
    return localStorage.getItem('gameLibrary_currentUser');
  }

  /**
   * Save users to localStorage
   */
  saveUsers() {
    localStorage.setItem('gameLibrary_users', JSON.stringify(this.registeredUsers));
  }

  /**
   * Save current user to localStorage
   */
  saveCurrentUser(username) {
    localStorage.setItem('gameLibrary_currentUser', username);
    this.currentUser = username;
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePassword(password) {
    return password.length >= 6;
  }

  /**
   * Register a new user
   */
  register(username, email, password, confirmPassword) {
    // Validation
    if (!username.trim()) {
      return { success: false, message: 'Username is required' };
    }
    if (!email.trim()) {
      return { success: false, message: 'Email is required' };
    }
    if (!this.validateEmail(email)) {
      return { success: false, message: 'Invalid email format' };
    }
    if (!this.validatePassword(password)) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }
    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }
    if (this.registeredUsers[username]) {
      return { success: false, message: 'Username already exists' };
    }

    // Register user
    this.registeredUsers[username] = {
      email,
      password, // In production, use bcrypt or similar
      createdAt: new Date().toISOString(),
    };

    this.saveUsers();
    this.saveCurrentUser(username);
    return { success: true, message: 'Registration successful!' };
  }

  /**
   * Login user
   */
  login(username, password) {
    if (!username.trim() || !password.trim()) {
      return { success: false, message: 'Username and password are required' };
    }

    const user = this.registeredUsers[username];
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password' };
    }

    this.saveCurrentUser(username);
    return { success: true, message: 'Login successful!' };
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('gameLibrary_currentUser');
    this.currentUser = null;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * Render registration modal
   */
  renderModal() {
    const modal = document.getElementById('register-modal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-content register-modal-content">
        <div class="modal-header">
          <h2>Create Account</h2>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        
        <div class="modal-tabs">
          <button class="tab-btn active" data-tab="register">Register</button>
          <button class="tab-btn" data-tab="login">Login</button>
        </div>

        <div class="tab-content">
          <!-- Register Tab -->
          <form class="register-form" id="register-form" data-tab="register">
            <div class="form-group">
              <label for="reg-username">Username:</label>
              <input type="text" id="reg-username" placeholder="Choose a username" required>
            </div>
            <div class="form-group">
              <label for="reg-email">Email:</label>
              <input type="email" id="reg-email" placeholder="Enter your email" required>
            </div>
            <div class="form-group">
              <label for="reg-password">Password:</label>
              <input type="password" id="reg-password" placeholder="At least 6 characters" required>
            </div>
            <div class="form-group">
              <label for="reg-confirm-password">Confirm Password:</label>
              <input type="password" id="reg-confirm-password" placeholder="Confirm password" required>
            </div>
            <div class="form-message" id="reg-message"></div>
            <button type="submit" class="btn btn-primary">Register</button>
          </form>

          <!-- Login Tab -->
          <form class="login-form hidden" id="login-form" data-tab="login">
            <div class="form-group">
              <label for="login-username">Username:</label>
              <input type="text" id="login-username" placeholder="Enter your username" required>
            </div>
            <div class="form-group">
              <label for="login-password">Password:</label>
              <input type="password" id="login-password" placeholder="Enter your password" required>
            </div>
            <div class="form-message" id="login-message"></div>
            <button type="submit" class="btn btn-primary">Login</button>
          </form>
        </div>
      </div>
    `;

    this.attachModalEvents();
  }

  /**
   * Attach modal event listeners
   */
  attachModalEvents() {
    const modal = document.getElementById('register-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const tabBtns = modal.querySelectorAll('.tab-btn');
    const registerForm = modal.querySelector('#register-form');
    const loginForm = modal.querySelector('#login-form');

    // Close modal
    closeBtn.addEventListener('click', () => this.closeModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });

    // Tab switching
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchTab(tab, modal);
      });
    });

    // Register form submit
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = modal.querySelector('#reg-username').value;
      const email = modal.querySelector('#reg-email').value;
      const password = modal.querySelector('#reg-password').value;
      const confirmPassword = modal.querySelector('#reg-confirm-password').value;

      const result = this.register(username, email, password, confirmPassword);
      const messageEl = modal.querySelector('#reg-message');

      messageEl.textContent = result.message;
      messageEl.className = result.success ? 'form-message success' : 'form-message error';

      if (result.success) {
        setTimeout(() => {
          this.closeModal();
          this.updateHeaderUser();
        }, 1500);
      }
    });

    // Login form submit
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = modal.querySelector('#login-username').value;
      const password = modal.querySelector('#login-password').value;

      const result = this.login(username, password);
      const messageEl = modal.querySelector('#login-message');

      messageEl.textContent = result.message;
      messageEl.className = result.success ? 'form-message success' : 'form-message error';

      if (result.success) {
        setTimeout(() => {
          this.closeModal();
          this.updateHeaderUser();
        }, 1500);
      }
    });
  }

  /**
   * Switch between register and login tabs
   */
  switchTab(tab, modal) {
    const forms = modal.querySelectorAll('.register-form, .login-form');
    const btns = modal.querySelectorAll('.tab-btn');

    forms.forEach((form) => {
      if (form.dataset.tab === tab) {
        form.classList.remove('hidden');
      } else {
        form.classList.add('hidden');
      }
    });

    btns.forEach((btn) => {
      if (btn.dataset.tab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Open registration modal
   */
  openModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  /**
   * Close registration modal
   */
  closeModal() {
    const modal = document.getElementById('register-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  /**
   * Update header with user info
   */
  updateHeaderUser() {
    const headerIcons = document.querySelector('.header-icons');
    if (!headerIcons) return;

    if (this.isLoggedIn()) {
      // Replace with greeting and logout button
      headerIcons.innerHTML = `
        <span class="user-greeting">
          👋 Hello, <strong>${this.currentUser}</strong>
        </span>
        <a href="#" class="btn btn-small logout-btn" title="Logout">
          Logout
        </a>
      `;

      // Attach logout handler
      const logoutBtn = headerIcons.querySelector('.logout-btn');
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
        this.updateHeaderUser();
        window.location.href = 'index.html';
      });
    } else {
      // Show user account icon
      headerIcons.innerHTML = `
        <a href="register.html" class="icon-link user-account-link" title="Sign In / User Account">
          <svg class="user-account-icon" width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
            <!-- Outer circle -->
            <circle cx="128" cy="128" r="110" fill="none" stroke="currentColor" stroke-width="16"/>
            
            <!-- Head -->
            <circle cx="128" cy="96" r="32" fill="none" stroke="currentColor" stroke-width="16"/>
            
            <!-- Shoulders -->
            <path d="M64 176 A64 64 0 0 1 192 176" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round"/>
          </svg>
        </a>
      `;
    }
  }

  /**
   * Initialize register modal
   */
  init() {
    this.renderModal();
    this.updateHeaderUser();

    // Attach click listener to user icon
    const userLink = document.querySelector('.user-account-link');
    if (userLink) {
      userLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this.isLoggedIn()) {
          this.openModal();
        }
      });
    }
  }
}

// Export class for instantiation in main.js
export { Register as register };
