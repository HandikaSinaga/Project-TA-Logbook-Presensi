// Test script to check admin endpoints
// Run with: node test-admin-endpoints.js

import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001/api";

async function testEndpoints() {
    console.log("🧪 Testing Admin Endpoints...\n");

    // Test 1: Check if server is running
    try {
        console.log("1. Testing server connection...");
        const response = await fetch(`${BASE_URL}/auth/check`);
        console.log(`   ✓ Server is running (${response.status})\n`);
    } catch (error) {
        console.log(`   ✗ Server is not running: ${error.message}\n`);
        return;
    }

    // Test 2: Test logbook endpoint without auth (should fail with 401)
    try {
        console.log("2. Testing /admin/logbook without auth...");
        const response = await fetch(
            `${BASE_URL}/admin/logbook?start_date=2026-01-10&end_date=2026-01-10`
        );
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, data);
        if (response.status === 401) {
            console.log(`   ✓ Correctly requires authentication\n`);
        } else {
            console.log(`   ⚠ Unexpected status code\n`);
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}\n`);
    }

    // Test 3: Test leave endpoint without auth (should fail with 401)
    try {
        console.log("3. Testing /admin/leave without auth...");
        const response = await fetch(
            `${BASE_URL}/admin/leave?start_date=2026-01-10&end_date=2026-01-10`
        );
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, data);
        if (response.status === 401) {
            console.log(`   ✓ Correctly requires authentication\n`);
        } else {
            console.log(`   ⚠ Unexpected status code\n`);
        }
    } catch (error) {
        console.log(`   ✗ Error: ${error.message}\n`);
    }

    console.log("✅ Test completed!");
    console.log(
        "\nNote: To test with authentication, login through the frontend"
    );
    console.log(
        "and copy the token from localStorage, then add it to this script."
    );
}

testEndpoints().catch(console.error);
