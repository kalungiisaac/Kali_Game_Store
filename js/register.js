class register {
  constructor() {
    this.registeredUsers = this.loadUsers();
    this.currentUser = this.loadCurrentUser();
    this.validationTimeouts = {};
  }

  
   // Load registered users from localStorage
   
  loadUsers() {
    const users = localStorage.getItem('gameLibrary_users');
    return users ? JSON.parse(users) : {};
  }

  
   //Load currently logged-in user from localStorage
   
  loadCurrentUser() {
    return localStorage.getItem('gameLibrary_currentUser');
  }

  
   //Save users to localStorage
   
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
   * Validate username format (no special chars, 3-20 chars)
   */
  validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * Check password strength with detailed analysis
   */
  checkPasswordStrength(password) {
    const strength = {
      score: 0,
      hasLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      feedback: []
    };

    // Calculate score (0-5)
    if (strength.hasLength) strength.score++;
    if (strength.hasUpperCase) strength.score++;
    if (strength.hasLowerCase) strength.score++;
    if (strength.hasNumbers) strength.score++;
    if (strength.hasSpecial) strength.score++;

    // Generate feedback
    if (!strength.hasLength) strength.feedback.push('At least 6 characters');
    if (!strength.hasUpperCase) strength.feedback.push('One uppercase letter');
    if (!strength.hasLowerCase) strength.feedback.push('One lowercase letter');
    if (!strength.hasNumbers) strength.feedback.push('One number');
    if (!strength.hasSpecial) strength.feedback.push('One special character');

    return strength;
  }

  /**
   * Check if email is already registered
   */
  isEmailRegistered(email) {
    return Object.values(this.registeredUsers).some(user => user.email === email);
  }

  /**
   * Check if username exists
   */
  isUsernameTaken(username) {
    return !!this.registeredUsers[username];
  }

  /**
   * Register a new user
   */
  register(username, email, password, confirmPassword) {
    // Validation
    if (!username.trim()) {
      return { success: false, message: 'Username is required' };
    }
    if (!this.validateUsername(username)) {
      return { success: false, message: 'Username must be 3-20 characters (letters, numbers, underscores only)' };
    }
    if (!email.trim()) {
      return { success: false, message: 'Email is required' };
    }
    if (!this.validateEmail(email)) {
      return { success: false, message: 'Invalid email format' };
    }
    if (this.isEmailRegistered(email)) {
      return { success: false, message: 'Email already registered' };
    }
    if (!password) {
      return { success: false, message: 'Password is required' };
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

    // Check password strength for feedback
    const strength = this.checkPasswordStrength(password);
    if (strength.score < 3) {
      return { 
        success: false, 
        message: 'Password is too weak. ' + strength.feedback.join(', ') 
      };
    }

    // Register user
    this.registeredUsers[username] = {
      email,
      password, // In production, use bcrypt or similar
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    this.saveUsers();
    this.saveCurrentUser(username);
    return { success: true, message: 'Registration successful!' };

  }
  
  //login user
   
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

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveUsers();
    this.saveCurrentUser(username);
    
    return { success: true, message: 'Login successful!' };
  }

  
   // Logout user
   
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
   * Get current user data
   */
  getCurrentUserData() {
    if (!this.currentUser) return null;
    return this.registeredUsers[this.currentUser];
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    return this.currentUser !== null;
  }

  /**
   * Real-time username validation
   */
  validateUsernameRealTime(username, messageEl) {
    if (!username) {
      messageEl.textContent = '';
      messageEl.className = 'form-message';
      return false;
    }

    if (!this.validateUsername(username)) {
      messageEl.textContent = '❌ Username must be 3-20 characters (letters, numbers, underscores only)';
      messageEl.className = 'form-message';
      return false;
    }

    if (this.isUsernameTaken(username)) {
      messageEl.textContent = '❌ Username already taken';
      messageEl.className = 'form-message';
      return false;
    }

    messageEl.textContent = '✅ Username available';
    messageEl.className = 'form-message';
    return true;
  }

  /**
   * Real-time email validation
   */
  validateEmailRealTime(email, messageEl) {
    if (!email) {
      messageEl.textContent = '';
      messageEl.className = 'form-message';
      return false;
    }

    if (!this.validateEmail(email)) {
      messageEl.textContent = '❌ Invalid email format';
      messageEl.className = 'form-message';
      return false;
    }

    if (this.isEmailRegistered(email)) {
      messageEl.textContent = '❌ Email already registered';
      messageEl.className = 'form-message';
      return false;
    }

    messageEl.textContent = '✅ Email available';
    messageEl.className = 'form-message';
    return true;
  }

  /**
   * Real-time password validation with strength meter
   */
  validatePasswordRealTime(password, confirmPassword, messageEl, strengthEl, requirementsEl) {
    if (!password) {
      if (strengthEl) strengthEl.innerHTML = '';
      if (requirementsEl) requirementsEl.innerHTML = '';
      if (messageEl) messageEl.textContent = '';
      return false;
    }

    const strength = this.checkPasswordStrength(password);
    
    // Update strength meter - using inline styles only, no external CSS classes
    if (strengthEl) {
      const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength.score] || 'Very Weak';
      const strengthColor = ['#ef4444', '#ef4444', '#f59e0b', '#10b981', '#10b981'][strength.score] || '#ef4444';
      strengthEl.innerHTML = `
        <div style="margin-top:5px; height:4px; background:#e0e0e0; border-radius:2px; overflow:hidden; margin-bottom:5px;">
          <div style="height:100%; width:${strength.score * 20}%; background-color:${strengthColor}; transition:width 0.3s ease;"></div>
        </div>
        <span style="color:${strengthColor};">${strengthText}</span>
      `;
    }

    // Update requirements checklist - using inline styles only
    if (requirementsEl) {
      requirementsEl.innerHTML = `
        <li style="${strength.hasLength ? 'color:#4caf50;' : 'color:#999;'}">✓ At least 6 characters</li>
        <li style="${strength.hasUpperCase ? 'color:#4caf50;' : 'color:#999;'}">✓ One uppercase letter</li>
        <li style="${strength.hasLowerCase ? 'color:#4caf50;' : 'color:#999;'}">✓ One lowercase letter</li>
        <li style="${strength.hasNumbers ? 'color:#4caf50;' : 'color:#999;'}">✓ One number</li>
        <li style="${strength.hasSpecial ? 'color:#4caf50;' : 'color:#999;'}">✓ One special character</li>
      `;
    }

    // Check if passwords match
    if (confirmPassword !== undefined && messageEl) {
      if (password !== confirmPassword) {
        messageEl.textContent = '❌ Passwords do not match';
        messageEl.className = 'form-message';
        return false;
      } else if (confirmPassword) {
        messageEl.textContent = '✅ Passwords match';
        messageEl.className = 'form-message';
      } else {
        messageEl.textContent = '';
      }
    }

    return strength.score >= 3;
  }

  // Render registration modal with enhanced validation UI
   
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
              <input type="text" id="reg-username" placeholder="Choose a username (3-20 chars)" required>
              <div class="form-message" id="reg-username-validation"></div>
            </div>
            <div class="form-group">
              <label for="reg-email">Email:</label>
              <input type="email" id="reg-email" placeholder="Enter your email" required>
              <div class="form-message" id="reg-email-validation"></div>
            </div>
            <div class="form-group">
              <label for="reg-password">Password:</label>
              <input type="password" id="reg-password" placeholder="At least 6 characters" required>
              <div id="reg-password-strength"></div>
              <ul id="reg-password-requirements" style="list-style:none; padding:0; margin:5px 0; font-size:12px;"></ul>
            </div>
            <div class="form-group">
              <label for="reg-confirm-password">Confirm Password:</label>
              <input type="password" id="reg-confirm-password" placeholder="Confirm password" required>
              <div class="form-message" id="reg-confirm-validation"></div>
            </div>
            <div class="form-message" id="reg-message"></div>
            <button type="submit" class="btn btn-primary" id="reg-submit" disabled>Register</button>
          </form>

          <!-- Login Tab -->
          <form class="login-form hidden" id="login-form" data-tab="login">
            <div class="form-group">
              <label for="login-username">Username:</label>
              <input type="text" id="login-username" placeholder="Enter your username" required>
              <div class="form-message" id="login-username-validation"></div>
            </div>
            <div class="form-group">
              <label for="login-password">Password:</label>
              <input type="password" id="login-password" placeholder="Enter your password" required>
              <div class="form-message" id="login-password-validation"></div>
            </div>
            <div class="form-message" id="login-message"></div>
            <button type="submit" class="btn btn-primary" id="login-submit" disabled>Login</button>
          </form>
        </div>
      </div>
    `;

    this.attachModalEvents();
  }

  /**
   * Attach modal event listeners with real-time validation
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

    // Register form real-time validation
    const regUsername = modal.querySelector('#reg-username');
    const regEmail = modal.querySelector('#reg-email');
    const regPassword = modal.querySelector('#reg-password');
    const regConfirm = modal.querySelector('#reg-confirm-password');
    const regSubmit = modal.querySelector('#reg-submit');

    const regUsernameMsg = modal.querySelector('#reg-username-validation');
    const regEmailMsg = modal.querySelector('#reg-email-validation');
    const regConfirmMsg = modal.querySelector('#reg-confirm-validation');
    const regStrengthEl = modal.querySelector('#reg-password-strength');
    const regRequirementsEl = modal.querySelector('#reg-password-requirements');

    const checkRegisterValidity = () => {
      const usernameValid = this.validateUsernameRealTime(regUsername.value, regUsernameMsg);
      const emailValid = this.validateEmailRealTime(regEmail.value, regEmailMsg);
      const passwordValid = this.validatePasswordRealTime(
        regPassword.value, 
        regConfirm.value, 
        regConfirmMsg, 
        regStrengthEl, 
        regRequirementsEl
      );
      
      regSubmit.disabled = !(usernameValid && emailValid && passwordValid);
    };

    regUsername.addEventListener('input', () => {
      clearTimeout(this.validationTimeouts.username);
      this.validationTimeouts.username = setTimeout(() => checkRegisterValidity(), 300);
    });

    regEmail.addEventListener('input', () => {
      clearTimeout(this.validationTimeouts.email);
      this.validationTimeouts.email = setTimeout(() => checkRegisterValidity(), 300);
    });

    regPassword.addEventListener('input', () => {
      this.validatePasswordRealTime(regPassword.value, regConfirm.value, regConfirmMsg, regStrengthEl, regRequirementsEl);
      checkRegisterValidity();
    });

    regConfirm.addEventListener('input', () => {
      this.validatePasswordRealTime(regPassword.value, regConfirm.value, regConfirmMsg, regStrengthEl, regRequirementsEl);
      checkRegisterValidity();
    });

    // Register form submit
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = regUsername.value;
      const email = regEmail.value;
      const password = regPassword.value;
      const confirmPassword = regConfirm.value;

      const result = this.register(username, email, password, confirmPassword);
      const messageEl = modal.querySelector('#reg-message');

      messageEl.textContent = result.message;
      messageEl.className = 'form-message';

      if (result.success) {
        setTimeout(() => {
          this.closeModal();
          this.updateHeaderUser();
        }, 1500);
      }
    });

    // Login form real-time validation
    const loginUsername = modal.querySelector('#login-username');
    const loginPassword = modal.querySelector('#login-password');
    const loginSubmit = modal.querySelector('#login-submit');
    const loginUsernameMsg = modal.querySelector('#login-username-validation');
    const loginPasswordMsg = modal.querySelector('#login-password-validation');

    const checkLoginValidity = () => {
      const username = loginUsername.value.trim();
      const password = loginPassword.value.trim();
      
      let isValid = true;

      if (username && !this.validateUsername(username)) {
        loginUsernameMsg.textContent = '❌ Invalid username format';
        loginUsernameMsg.className = 'form-message';
        isValid = false;
      } else if (username && !this.isUsernameTaken(username)) {
        loginUsernameMsg.textContent = '❌ Username not found';
        loginUsernameMsg.className = 'form-message';
        isValid = false;
      } else if (username) {
        loginUsernameMsg.textContent = '✅ Username exists';
        loginUsernameMsg.className = 'form-message';
      } else {
        loginUsernameMsg.textContent = '';
      }

      if (password && password.length < 6) {
        loginPasswordMsg.textContent = '❌ Password too short';
        loginPasswordMsg.className = 'form-message';
        isValid = false;
      } else if (password) {
        loginPasswordMsg.textContent = '✅ Password length OK';
        loginPasswordMsg.className = 'form-message';
      } else {
        loginPasswordMsg.textContent = '';
      }

      loginSubmit.disabled = !(username && password && isValid);
    };

    loginUsername.addEventListener('input', checkLoginValidity);
    loginPassword.addEventListener('input', checkLoginValidity);

    // Login form submit
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = loginUsername.value;
      const password = loginPassword.value;

      const result = this.login(username, password);
      const messageEl = modal.querySelector('#login-message');

      messageEl.textContent = result.message;
      messageEl.className = 'form-message';

      if (result.success) {
        setTimeout(() => {
          this.closeModal();
          this.updateHeaderUser();
        }, 1500);
      }
    });
  }

  
   // Switch between register and login tabs
   
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

  
   //Close registration modal
   
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
      const userData = this.getCurrentUserData();
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
      // Show user account icon - YOUR EXACT ORIGINAL HTML
      headerIcons.innerHTML = `
        <a href="#" class="icon-link user-account-link" title="Sign In">
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

      // Attach click listener to user icon
      const userLink = headerIcons.querySelector('.user-account-link');
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

  //Initialize register modal
   
  init() {
    this.renderModal();
    this.updateHeaderUser();
  }
}

// Export class for instantiation in main.js
export { register as register };