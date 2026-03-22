console.log('🧹 Cleaning up authentication state...\n');

// Clear all auth-related localStorage data
const authKeys = ['collegeData', 'tpoData', 'studentData', 'professionalData'];
authKeys.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    console.log(`❌ Removing ${key}:`, JSON.parse(data));
    localStorage.removeItem(key);
  }
});

// Clear all auth-related cookies
const authCookies = ['auth_session', 'collegeData', 'tpoData', 'studentData'];
authCookies.forEach(cookieName => {
  document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  console.log(`🍪 Cleared cookie: ${cookieName}`);
});

console.log('\n✅ Authentication state cleared!');
console.log('🔄 Please refresh the page and login again with the correct credentials.');
console.log('\n📍 Login URLs:');
console.log('   • Dept TPO: /tpo-login');
console.log('   • Central TPO: /college-login');

// Redirect to home page
window.location.href = '/';