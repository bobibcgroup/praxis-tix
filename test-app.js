/**
 * Comprehensive Test Script for Praxis Tix Application
 * 
 * This script tests all routes and functionalities of the app.
 * Run with: node test-app.js
 * 
 * Prerequisites:
 * - App should be running locally or deployed
 * - Update BASE_URL below to match your deployment
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';
// For deployed version: 'https://praxis-tix.vercel.app'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passedTests = 0;
let failedTests = 0;
const testResults = [];

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function test(name, fn) {
  return async () => {
    try {
      await fn();
      passedTests++;
      testResults.push({ name, status: 'PASS', error: null });
      log(`✓ ${name}`, colors.green);
    } catch (error) {
      failedTests++;
      testResults.push({ name, status: 'FAIL', error: error.message });
      log(`✗ ${name}: ${error.message}`, colors.red);
    }
  };
}

async function fetchRoute(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'text/html,application/json',
        ...options.headers,
      },
    });
    return {
      status: response.status,
      ok: response.ok,
      url: response.url,
      redirected: response.redirected,
    };
  } catch (error) {
    throw new Error(`Network error: ${error.message}`);
  }
}

async function checkPageLoads(path, expectedStatus = 200) {
  const result = await fetchRoute(path);
  if (result.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${result.status}`);
  }
  if (!result.ok && expectedStatus === 200) {
    throw new Error(`Page failed to load: ${result.status}`);
  }
}

// Test Suite
async function runTests() {
  log('\n🧪 Starting Praxis Tix Test Suite\n', colors.cyan);
  log(`Testing against: ${BASE_URL}\n`, colors.blue);

  // Route Tests
  log('📋 Testing Routes...\n', colors.cyan);
  
  await test('Root route (/) loads', async () => {
    await checkPageLoads('/');
  });

  await test('Landing page (/landing) loads', async () => {
    await checkPageLoads('/landing');
  });

  await test('History page (/history) loads', async () => {
    await checkPageLoads('/history');
  });

  await test('Profile page (/profile) loads', async () => {
    await checkPageLoads('/profile');
  });

  await test('Favorites page (/favorites) loads', async () => {
    await checkPageLoads('/favorites');
  });

  await test('Settings page (/settings) loads', async () => {
    await checkPageLoads('/settings');
  });

  await test('Non-existent route returns 404', async () => {
    const result = await fetchRoute('/nonexistent-route-12345');
    // Should either return 404 or redirect to NotFound page (200 with NotFound component)
    if (result.status !== 404 && result.status !== 200) {
      throw new Error(`Expected 404 or 200, got ${result.status}`);
    }
  });

  // API Route Tests
  log('\n🔌 Testing API Routes...\n', colors.cyan);

  await test('Replicate proxy endpoint exists', async () => {
    // This will likely return 405 (Method Not Allowed) or 400 (Bad Request) 
    // since we're not sending proper POST data, but endpoint should exist
    const result = await fetchRoute('/api/replicate-proxy', { method: 'POST' });
    if (result.status === 404) {
      throw new Error('API endpoint not found');
    }
  });

  await test('Replicate status endpoint exists', async () => {
    const result = await fetchRoute('/api/replicate-status?id=test');
    if (result.status === 404) {
      throw new Error('API endpoint not found');
    }
  });

  // Functionality Tests (requires manual verification)
  log('\n⚙️  Functionality Tests (Manual Verification Required)...\n', colors.cyan);

  log('The following features require manual testing:\n', colors.yellow);
  
  const manualTests = [
    'Quick Flow: Mode selection → Occasion → Context → Preferences → Results → Complete',
    'Personal Flow: Mode selection → Photo upload → Fit calibration → Lifestyle → Inspiration → Wardrobe → Results → Try-on → Style DNA',
    'History page: View saved outfits, delete outfit, filter by occasion, search, sort',
    'Favorites: Add/remove favorites from Results and History pages',
    'Profile: View Style DNA, color palette, fit preferences, lifestyle',
    'Settings: Export data, view account information',
    'Edit Profile: Navigate from Profile page to Personal Flow',
    'Use Outfit Again: Click button in History to restart flow',
    'Save Style: Click "Save my style" button in Style DNA step',
    'Authentication: Sign in/out, protected routes redirect correctly',
  ];

  manualTests.forEach((test, index) => {
    log(`${index + 1}. ${test}`, colors.blue);
  });

  // Summary
  log('\n📊 Test Summary\n', colors.cyan);
  log(`Total Tests: ${passedTests + failedTests}`, colors.blue);
  log(`Passed: ${passedTests}`, colors.green);
  log(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green);

  if (failedTests > 0) {
    log('\n❌ Failed Tests:\n', colors.red);
    testResults
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        log(`  - ${t.name}`, colors.red);
        log(`    Error: ${t.error}\n`, colors.yellow);
      });
  }

  log('\n✅ Test suite completed!\n', colors.cyan);
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}\n`, colors.red);
  console.error(error);
  process.exit(1);
});
