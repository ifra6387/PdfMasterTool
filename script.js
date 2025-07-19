// Supabase configuration
const SUPABASE_URL = 'https://valkgbmvpbcxlrunffpu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbGtnYm12cGJjeGxydW5mZnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NDYyNzcsImV4cCI6MjA1MjMyMjI3N30.LULIWUbkTJnwLF5lD1t_6qOuiJPGAk9pGFXw_N0Iqhw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;

/**
 * Initialize authentication listeners and check current session
 */
function initializeAuth() {
    console.log('Initializing Supabase authentication...');
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
            currentUser = session.user;
            console.log('User signed in:', currentUser.email);
            
            // Hide access token from URL after successful OAuth
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, null, window.location.pathname);
            }
            
            // Redirect to dashboard if on login page
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                window.location.href = '/dashboard.html';
            }
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            console.log('User signed out');
            
            // Redirect to login if on dashboard
            if (window.location.pathname === '/dashboard.html') {
                window.location.href = '/index.html';
            }
        }
    });
    
    // Check for existing session
    checkExistingSession();
}

/**
 * Check if user has an existing session
 */
async function checkExistingSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error checking session:', error);
            return;
        }
        
        if (session?.user) {
            currentUser = session.user;
            console.log('Existing session found for:', currentUser.email);
            
            // Redirect to dashboard if on login page
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                window.location.href = '/dashboard.html';
            }
        } else {
            console.log('No existing session found');
            
            // Redirect to login if on dashboard without session
            if (window.location.pathname === '/dashboard.html') {
                window.location.href = '/index.html';
            }
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

/**
 * Sign in with email and password
 */
async function signInWithEmail(email, password) {
    try {
        console.log('Attempting email sign in for:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            // If user doesn't exist, try to sign them up
            if (error.message.includes('Invalid login credentials')) {
                console.log('User not found, attempting signup...');
                return await signUpWithEmail(email, password);
            }
            throw error;
        }
        
        console.log('Email sign in successful:', data.user.email);
        return { success: true, user: data.user };
        
    } catch (error) {
        console.error('Email sign in error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign up with email and password
 */
async function signUpWithEmail(email, password) {
    try {
        console.log('Attempting email sign up for:', email);
        
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        console.log('Email sign up successful:', data.user.email);
        return { success: true, user: data.user };
        
    } catch (error) {
        console.error('Email sign up error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign in with Google OAuth
 */
async function signInWithGoogle() {
    try {
        console.log('Initiating Google OAuth sign in...');
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        
        if (error) throw error;
        
        console.log('Google OAuth initiated');
        
    } catch (error) {
        console.error('Google sign in error:', error);
        showError('Google sign in failed: ' + error.message);
    }
}

/**
 * Sign out current user
 */
async function signOut() {
    try {
        console.log('Signing out user...');
        
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        console.log('Sign out successful');
        
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

/**
 * Show error message on login page
 */
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
}

/**
 * Initialize login page
 */
function initializeLoginPage() {
    const emailForm = document.getElementById('email-login-form');
    const googleButton = document.getElementById('google-login-btn');
    
    // Handle email/password form submission
    if (emailForm) {
        emailForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showError('Please enter both email and password');
                return;
            }
            
            setButtonLoading('email-login-btn', true);
            
            const result = await signInWithEmail(email, password);
            
            setButtonLoading('email-login-btn', false);
            
            if (!result.success) {
                showError(result.error);
            }
            // Success handling is done by auth state change listener
        });
    }
    
    // Handle Google sign in button
    if (googleButton) {
        googleButton.addEventListener('click', async function() {
            setButtonLoading('google-login-btn', true);
            await signInWithGoogle();
            // Note: Button state will be reset when page redirects
        });
    }
}

/**
 * Initialize dashboard page
 */
function initializeDashboard() {
    const loadingElement = document.getElementById('loading');
    const dashboardElement = document.getElementById('dashboard');
    const logoutButton = document.getElementById('logout-btn');
    const userEmailElement = document.getElementById('user-email');
    
    // Handle logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', async function() {
            await signOut();
        });
    }
    
    // Check authentication and show appropriate content
    async function checkDashboardAuth() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
                console.error('Dashboard auth check error:', error);
                window.location.href = '/index.html';
                return;
            }
            
            if (session?.user) {
                currentUser = session.user;
                
                // Update UI with user info
                if (userEmailElement) {
                    userEmailElement.textContent = `Welcome, ${currentUser.email}!`;
                }
                
                // Show dashboard, hide loading
                if (loadingElement) loadingElement.style.display = 'none';
                if (dashboardElement) dashboardElement.style.display = 'block';
                
                console.log('Dashboard loaded for user:', currentUser.email);
                
            } else {
                console.log('No session found, redirecting to login');
                window.location.href = '/index.html';
            }
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            window.location.href = '/index.html';
        }
    }
    
    // Run authentication check
    checkDashboardAuth();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');
    
    // Initialize auth system
    initializeAuth();
    
    // Initialize page-specific functionality
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        console.log('Initializing login page');
        initializeLoginPage();
    } else if (window.location.pathname === '/dashboard.html') {
        console.log('Initializing dashboard page');
        // Dashboard initialization is handled separately
    }
});

// Export functions for global access
window.authFunctions = {
    signInWithEmail,
    signInWithGoogle,
    signOut,
    initializeDashboard
};