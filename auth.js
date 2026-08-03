// ============================================================================
// auth.js — Client-side simulation of the MVNP Django backend.
//
// Since this is a static HTML/CSS/JS site (no server), user accounts,
// sessions, and research applications are simulated using the browser's
// localStorage. This mirrors the behaviour of the original Django app
// (accounts, login/signup, research application workflow, admin review,
// profile management) without a real database or email server.
//
// Storage keys:
//   mvnp_users        — array of user objects (the "auth_user" table)
//   mvnp_applications — array of research application objects
//   mvnp_session      — username of the currently logged-in user
// ============================================================================

(function () {
  'use strict';

  var LS_USERS = 'mvnp_users';
  var LS_APPS = 'mvnp_applications';
  var LS_SESSION = 'mvnp_session';
  var LS_STUDY_ADDED = 'mvnp_studies_added';
  var LS_STUDY_EDITS = 'mvnp_studies_edits';
  var LS_STUDY_DELETED = 'mvnp_studies_deleted';

  // ── Seed data (first run only) ───────────────────────────────────────────
  function seed() {
    if (!localStorage.getItem(LS_USERS)) {
      var users = [
        {
          id: 1,
          username: 'mvnp_admin',
          password: 'mvnp@dmiN2o26',
          email: 'mvnp@denr.gov.ph',
          first_name: 'MVNP',
          last_name: 'Administrator',
          is_staff: true,
          date_joined: new Date().toISOString()
        },
        {
          id: 2,
          username: 'researcher',
          password: 'researcher123',
          email: 'researcher@example.com',
          first_name: 'Demo',
          last_name: 'Researcher',
          is_staff: false,
          date_joined: new Date().toISOString()
        }
      ];
      localStorage.setItem(LS_USERS, JSON.stringify(users));
    }
    if (!localStorage.getItem(LS_APPS)) {
      localStorage.setItem(LS_APPS, JSON.stringify([]));
    }
  }
  seed();

  // ── Low-level storage helpers ────────────────────────────────────────────
  function getUsers() { return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); }
  function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }
  function getApps() { return JSON.parse(localStorage.getItem(LS_APPS) || '[]'); }
  function saveApps(a) { localStorage.setItem(LS_APPS, JSON.stringify(a)); }
  function nextId(list) {
    return list.reduce(function (max, x) { return Math.max(max, x.id); }, 0) + 1;
  }

  // ── Session / auth ───────────────────────────────────────────────────────
  function currentUser() {
    var username = localStorage.getItem(LS_SESSION);
    if (!username) return null;
    var u = getUsers().filter(function (x) { return x.username === username; })[0];
    return u || null;
  }

  function isAuthenticated() { return !!currentUser(); }
  function isStaff() { var u = currentUser(); return !!(u && u.is_staff); }

  function login(username, password) {
    var u = getUsers().filter(function (x) {
      return x.username.toLowerCase() === username.toLowerCase();
    })[0];
    if (!u) return { ok: false, error: 'Please enter a correct username and password.' };
    if (!u.is_active && u.is_active !== undefined) {
      return { ok: false, error: 'This account is inactive.' };
    }
    if (u.password !== password) {
      return { ok: false, error: 'Please enter a correct username and password.' };
    }
    localStorage.setItem(LS_SESSION, u.username);
    return { ok: true, user: u };
  }

  function signup(username, password1, password2, email) {
    username = (username || '').trim();
    if (!username) return { ok: false, error: 'Username is required.' };
    if (username.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
    if (!password1 || password1.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    if (password1 !== password2) {
      return { ok: false, error: "The two password fields didn't match." };
    }
    var users = getUsers();
    var exists = users.some(function (x) {
      return x.username.toLowerCase() === username.toLowerCase();
    });
    if (exists) return { ok: false, error: 'A user with that username already exists.' };

    var user = {
      id: nextId(users),
      username: username,
      password: password1,
      email: email || '',
      first_name: '',
      last_name: '',
      is_staff: false,
      is_active: true,
      date_joined: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    localStorage.setItem(LS_SESSION, user.username);
    return { ok: true, user: user };
  }

  function logout() {
    localStorage.removeItem(LS_SESSION);
  }

  // ── Page guards ───────────────────────────────────────────────────────────
  function requireAuth() {
    if (!isAuthenticated()) {
      var next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
      location.href = 'login.html?next=' + next;
      return false;
    }
    return true;
  }

  function requireStaff() {
    if (!requireAuth()) return false;
    if (!isStaff()) {
      alert('Administrator privileges required.');
      location.href = 'index.html';
      return false;
    }
    return true;
  }

  // ── User management (staff) ─────────────────────────────────────────────
  function listUsers() {
    return getUsers().slice().sort(function (a, b) {
      return new Date(b.date_joined) - new Date(a.date_joined);
    });
  }

  function addUser(data) {
    var users = getUsers();
    if (users.some(function (x) { return x.username.toLowerCase() === data.username.toLowerCase(); })) {
      return { ok: false, error: 'A user with that username already exists.' };
    }
    var user = {
      id: nextId(users),
      username: data.username,
      password: data.password || 'changeme123',
      email: data.email || '',
      first_name: '',
      last_name: '',
      is_staff: !!data.is_staff,
      is_active: true,
      date_joined: new Date().toISOString()
    };
    users.push(user);
    saveUsers(users);
    return { ok: true, user: user };
  }

  function updateUser(id, data) {
    var users = getUsers();
    var idx = users.findIndex(function (x) { return x.id === id; });
    if (idx === -1) return { ok: false, error: 'User not found.' };
    users[idx] = Object.assign({}, users[idx], data);
    saveUsers(users);
    return { ok: true, user: users[idx] };
  }

  function deleteUser(id) {
    var cu = currentUser();
    if (cu && cu.id === id) {
      return { ok: false, error: 'You cannot delete your own account while logged in.' };
    }
    var users = getUsers().filter(function (x) { return x.id !== id; });
    saveUsers(users);
    return { ok: true };
  }

  // ── Research applications ───────────────────────────────────────────────
  function addApplication(data) {
    var user = currentUser();
    if (!user) return { ok: false, error: 'You must be logged in to submit an application.' };
    var apps = getApps();
    var app = Object.assign({}, data, {
      id: nextId(apps),
      user_id: user.id,
      applicant_username: user.username,
      status: 'Pending',
      reviewer: null,
      reviewed_at: null,
      submitted_at: new Date().toISOString()
    });
    apps.unshift(app);
    saveApps(apps);
    return { ok: true, application: app };
  }

  function allApplications() {
    return getApps();
  }

  function myApplications() {
    var user = currentUser();
    if (!user) return [];
    return getApps().filter(function (a) { return a.user_id === user.id; });
  }

  function reviewApplication(id, action) {
    var reviewer = currentUser();
    var apps = getApps();
    var idx = apps.findIndex(function (a) { return a.id === id; });
    if (idx === -1) return { ok: false, error: 'Application not found.' };
    if (apps[idx].status !== 'Pending') {
      return { ok: false, error: 'This application has already been reviewed.' };
    }
    apps[idx].status = action === 'approve' ? 'Approved' : 'Declined';
    apps[idx].reviewer = reviewer ? reviewer.username : 'MVNP staff';
    apps[idx].reviewed_at = new Date().toISOString();
    saveApps(apps);
    return { ok: true, application: apps[idx] };
  }

  // ── Repository studies (layered on top of the static STUDIES in data.js) ─
  function slugify(title, year) {
    var base = (title || 'study').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
    return base + '-' + (year || '') + '-' + Math.random().toString(36).slice(2, 6);
  }

  function getStudies() {
    var base = (typeof STUDIES !== 'undefined' ? STUDIES : []).map(function (s) { return Object.assign({}, s); });
    var edits = JSON.parse(localStorage.getItem(LS_STUDY_EDITS) || '{}');
    base.forEach(function (s) {
      if (edits[s.study_id]) Object.assign(s, edits[s.study_id]);
    });
    var added = JSON.parse(localStorage.getItem(LS_STUDY_ADDED) || '[]');
    var deleted = JSON.parse(localStorage.getItem(LS_STUDY_DELETED) || '[]');
    return base.concat(added).filter(function (s) { return deleted.indexOf(s.study_id) === -1; });
  }

  function addStudy(data) {
    var added = JSON.parse(localStorage.getItem(LS_STUDY_ADDED) || '[]');
    var study = Object.assign({}, data, { study_id: slugify(data.title, data.year), featured: false });
    added.push(study);
    localStorage.setItem(LS_STUDY_ADDED, JSON.stringify(added));
    return { ok: true, study: study };
  }

  function updateStudy(studyId, data) {
    var added = JSON.parse(localStorage.getItem(LS_STUDY_ADDED) || '[]');
    var idx = added.findIndex(function (s) { return s.study_id === studyId; });
    if (idx !== -1) {
      added[idx] = Object.assign({}, added[idx], data);
      localStorage.setItem(LS_STUDY_ADDED, JSON.stringify(added));
      return { ok: true };
    }
    var edits = JSON.parse(localStorage.getItem(LS_STUDY_EDITS) || '{}');
    edits[studyId] = Object.assign({}, edits[studyId], data);
    localStorage.setItem(LS_STUDY_EDITS, JSON.stringify(edits));
    return { ok: true };
  }

  function deleteStudy(studyId) {
    var added = JSON.parse(localStorage.getItem(LS_STUDY_ADDED) || '[]');
    var idx = added.findIndex(function (s) { return s.study_id === studyId; });
    if (idx !== -1) {
      added.splice(idx, 1);
      localStorage.setItem(LS_STUDY_ADDED, JSON.stringify(added));
      return { ok: true };
    }
    var deleted = JSON.parse(localStorage.getItem(LS_STUDY_DELETED) || '[]');
    if (deleted.indexOf(studyId) === -1) deleted.push(studyId);
    localStorage.setItem(LS_STUDY_DELETED, JSON.stringify(deleted));
    return { ok: true };
  }

  // ── Flash / toast messages (survive one redirect via sessionStorage) ────
  function flash(message, type) {
    var pending = JSON.parse(sessionStorage.getItem('mvnp_flash') || '[]');
    pending.push({ message: message, type: type || 'success' });
    sessionStorage.setItem('mvnp_flash', JSON.stringify(pending));
  }

  function renderFlashes() {
    var pending = JSON.parse(sessionStorage.getItem('mvnp_flash') || '[]');
    if (!pending.length) return;
    sessionStorage.removeItem('mvnp_flash');
    var wrap = document.createElement('div');
    wrap.className = 'flash-messages';
    pending.forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'flash ' + p.type;
      d.textContent = p.message;
      wrap.appendChild(d);
    });
    var main = document.querySelector('main');
    if (main) main.insertBefore(wrap, main.firstChild);
    setTimeout(function () {
      wrap.querySelectorAll('.flash').forEach(function (f) {
        f.style.transition = 'opacity .4s';
        f.style.opacity = '0';
      });
      setTimeout(function () { wrap.remove(); }, 450);
    }, 4500);
  }

  // ── Nav rendering ─────────────────────────────────────────────────────────
  function initials(u) {
    return (u.username || '?').charAt(0).toUpperCase();
  }

  function displayName(u) {
    var full = ((u.first_name || '') + ' ' + (u.last_name || '')).trim();
    return full || u.username;
  }

  function renderNav() {
    var navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Remove any previously-injected account block (in case of re-render)
    var existing = navLinks.querySelector('.nav-account, .nav-guest-links');
    if (existing) existing.remove();

    var user = currentUser();

    if (!user) {
      var guest = document.createElement('span');
      guest.className = 'nav-guest-links';
      guest.innerHTML =
        '<a href="login.html" data-page="login.html">Login</a>' +
        '<a href="signup.html" data-page="signup.html" class="nav-signup-btn">Sign Up</a>';
      navLinks.appendChild(guest);
      return;
    }

    var acct = document.createElement('div');
    acct.className = 'nav-account';
    var menuLinks = '';
    if (user.is_staff) {
      var pendingCount = getApps().filter(function (a) { return a.status === 'Pending'; }).length;
      menuLinks += '<a href="accounts.html">Accounts</a>';
      menuLinks += '<a href="applications.html">Applicants' + (pendingCount ? ' (' + pendingCount + ')' : '') + '</a>';
    } else {
      menuLinks += '<a href="my-applications.html">My Applications</a>';
    }
    menuLinks += '<a href="#" class="profile-panel-trigger">My Profile</a>';
    menuLinks += '<a href="#" id="navLogoutLink">Logout</a>';

    acct.innerHTML =
      '<button class="nav-burger" type="button" aria-expanded="false" aria-label="Open account menu">' +
      '<span></span><span></span><span></span></button>' +
      '<div class="nav-burger-menu" role="menu">' + menuLinks + '</div>';

    navLinks.appendChild(acct);

    var burger = acct.querySelector('.nav-burger');
    var menu = acct.querySelector('.nav-burger-menu');
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });

    acct.querySelector('#navLogoutLink').addEventListener('click', function (e) {
      e.preventDefault();
      logout();
      flash('You have been successfully logged out.', 'success');
      location.href = 'index.html';
    });

    acct.querySelector('.profile-panel-trigger').addEventListener('click', function (e) {
      e.preventDefault();
      openProfilePanel();
    });

    initProfilePanel(user);
  }

  // ── Profile drawer (injected once, populated per-user) ──────────────────
  function ensureProfilePanel() {
    if (document.getElementById('profile-panel')) return document.getElementById('profile-panel');

    var overlay = document.createElement('div');
    overlay.className = 'profile-overlay';
    overlay.id = 'profile-panel';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'My Profile');
    overlay.innerHTML =
      '<div class="profile-drawer">' +
        '<div class="profile-drawer-header">' +
          '<div class="profile-avatar" id="pfAvatar"></div>' +
          '<div>' +
            '<div class="profile-drawer-name" id="pfName"></div>' +
            '<div class="profile-drawer-role" id="pfRole"></div>' +
          '</div>' +
          '<button class="profile-close" aria-label="Close profile panel">&times;</button>' +
        '</div>' +
        '<div class="profile-tabs" role="tablist">' +
          '<button class="profile-tab active" role="tab" data-tab="tab-info">Personal Info</button>' +
          '<button class="profile-tab" role="tab" data-tab="tab-password">Change Password</button>' +
        '</div>' +
        '<div class="profile-tab-content active" id="tab-info">' +
          '<form class="profile-form" id="pfInfoForm">' +
            '<div class="pf-row">' +
              '<div class="pf-field"><label>First Name</label>' +
              '<input type="text" id="pf_first_name" placeholder="First name" maxlength="150"></div>' +
              '<div class="pf-field"><label>Last Name</label>' +
              '<input type="text" id="pf_last_name" placeholder="Last name" maxlength="150"></div>' +
            '</div>' +
            '<div class="pf-field"><label>Email Address</label>' +
            '<input type="email" id="pf_email" placeholder="your@email.com"></div>' +
            '<div class="pf-field pf-readonly"><label>Username</label>' +
            '<input type="text" id="pf_username" disabled>' +
            '<span class="pf-hint">Username cannot be changed here.</span></div>' +
            '<button type="submit" class="pf-btn-primary">Save Changes</button>' +
          '</form>' +
        '</div>' +
        '<div class="profile-tab-content" id="tab-password">' +
          '<form class="profile-form" id="pfPasswordForm">' +
            '<div class="pf-field"><label>Current Password</label>' +
            '<input type="password" id="pf_old_password" placeholder="Enter current password" autocomplete="current-password"></div>' +
            '<div class="pf-field"><label>New Password</label>' +
            '<input type="password" id="pf_new_password1" placeholder="Enter new password" autocomplete="new-password"></div>' +
            '<div class="pf-field"><label>Confirm New Password</label>' +
            '<input type="password" id="pf_new_password2" placeholder="Re-enter new password" autocomplete="new-password"></div>' +
            '<button type="submit" class="pf-btn-primary">Update Password</button>' +
          '</form>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeProfilePanel();
    });
    overlay.querySelector('.profile-close').addEventListener('click', closeProfilePanel);

    overlay.querySelectorAll('.profile-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        overlay.querySelectorAll('.profile-tab').forEach(function (t) { t.classList.remove('active'); });
        overlay.querySelectorAll('.profile-tab-content').forEach(function (c) { c.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
      });
    });

    return overlay;
  }

  function openProfilePanel() {
    var panel = ensureProfilePanel();
    var user = currentUser();
    if (user) {
      panel.querySelector('#pfAvatar').textContent = initials(user);
      panel.querySelector('#pfName').textContent = displayName(user);
      panel.querySelector('#pfRole').textContent = user.is_staff ? 'Administrator' : 'Researcher';
      panel.querySelector('#pf_first_name').value = user.first_name || '';
      panel.querySelector('#pf_last_name').value = user.last_name || '';
      panel.querySelector('#pf_email').value = user.email || '';
      panel.querySelector('#pf_username').value = user.username;
    }
    panel.classList.add('open');
  }

  function closeProfilePanel() {
    var panel = document.getElementById('profile-panel');
    if (panel) panel.classList.remove('open');
  }

  function initProfilePanel(user) {
    var panel = ensureProfilePanel();

    var infoForm = panel.querySelector('#pfInfoForm');
    infoForm.onsubmit = function (e) {
      e.preventDefault();
      var res = updateUser(user.id, {
        first_name: panel.querySelector('#pf_first_name').value.trim(),
        last_name: panel.querySelector('#pf_last_name').value.trim(),
        email: panel.querySelector('#pf_email').value.trim()
      });
      if (res.ok) {
        flash('Your profile has been updated successfully.', 'success');
        location.reload();
      } else {
        flash(res.error, 'error');
      }
    };

    var pwForm = panel.querySelector('#pfPasswordForm');
    pwForm.onsubmit = function (e) {
      e.preventDefault();
      var oldPw = panel.querySelector('#pf_old_password').value;
      var new1 = panel.querySelector('#pf_new_password1').value;
      var new2 = panel.querySelector('#pf_new_password2').value;
      var fresh = getUsers().filter(function (u) { return u.id === user.id; })[0];
      if (!fresh || fresh.password !== oldPw) {
        flash('Your old password was entered incorrectly.', 'error');
        return;
      }
      if (!new1 || new1.length < 6) {
        flash('New password must be at least 6 characters.', 'error');
        return;
      }
      if (new1 !== new2) {
        flash("The two password fields didn't match.", 'error');
        return;
      }
      updateUser(user.id, { password: new1 });
      flash('Your password has been changed successfully.', 'success');
      pwForm.reset();
      closeProfilePanel();
    };
  }

  // ── Page guard attributes ────────────────────────────────────────────────
  function applyPageGuards() {
    var body = document.body;
    if (!body) return;
    if (body.dataset.requiresStaff === 'true') {
      requireStaff();
    } else if (body.dataset.requiresAuth === 'true') {
      requireAuth();
    }
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    applyPageGuards();
    renderNav();
    renderFlashes();
  });

  // ── Public API ────────────────────────────────────────────────────────────
  window.MVNP = {
    currentUser: currentUser,
    isAuthenticated: isAuthenticated,
    isStaff: isStaff,
    login: login,
    signup: signup,
    logout: logout,
    requireAuth: requireAuth,
    requireStaff: requireStaff,
    listUsers: listUsers,
    addUser: addUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    addApplication: addApplication,
    allApplications: allApplications,
    myApplications: myApplications,
    reviewApplication: reviewApplication,
    getStudies: getStudies,
    addStudy: addStudy,
    updateStudy: updateStudy,
    deleteStudy: deleteStudy,
    flash: flash,
    renderNav: renderNav
  };
})();