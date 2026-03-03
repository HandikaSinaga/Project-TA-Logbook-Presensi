/**
 * Test Calendar API Endpoint
 *
 * This script provides a testing guide for the /api/user/calendar endpoint
 * to ensure the refactored code is working correctly.
 *
 * Run: node scripts/testCalendarAPI.js
 */

async function testCalendarAPI() {
    try {
        console.log("\n🧪 Testing Calendar API Endpoint...\n");

        // Note: This test requires a valid JWT token
        // For actual testing, you need to login first and get the token
        console.log("⚠️  This test requires authentication.");
        console.log("Please use Postman or browser to test:");
        console.log("\n📍 Endpoint: GET /api/user/calendar");
        console.log("   Query Params: year=2026, month=3");
        console.log("   Headers: Authorization: Bearer <your-token>\n");

        console.log("✅ Expected Response Structure:");
        console.log(`{
  "success": true,
  "message": "Data kalender berhasil dimuat",
  "data": {
    "period": {
      "year": 2026,
      "month": 3,
      "firstDay": "2026-03-01",
      "lastDay": "2026-03-31"
    },
    "user": {
      "id": 24,
      "name": "User Name",
      "email": "user@example.com",
      "created_at": "2025-12-05T00:00:00.000Z"
    },
    "workingDays": [1, 2, 3, 4, 5],
    "holidays": [...],
    "attendances": [...],
    "logbooks": [...],
    "leaves": [...],
    "summary": {
      "totalAttendances": 0,
      "lateCount": 0,
      "offsiteCount": 0,
      "totalLogbooks": 0,
      "totalLeaves": 0,
      "absentCount": 2,              // From AlphaCalculationService
      "expectedWorkingDays": 2,       // NEW
      "attendanceDays": 0,            // NEW
      "leaveDays": 0                  // NEW
    },
    "alphaDetails": {                 // NEW
      "periodStart": "2026-03-01",
      "periodEnd": "2026-03-31",
      "checkUntil": "2026-03-03",
      "userJoinDate": "2025-12-05",
      "workingDaysConfig": [1,2,3,4,5],
      "holidaysCount": 3
    }
  }
}\n`);

        console.log("🔍 Key Changes to Verify:");
        console.log("   1. ✅ 'user' object includes 'created_at'");
        console.log(
            "   2. ✅ 'summary.absentCount' matches 'alphaDetails.absentCount'",
        );
        console.log("   3. ✅ 'summary.expectedWorkingDays' is present");
        console.log("   4. ✅ 'summary.attendanceDays' is present");
        console.log("   5. ✅ 'summary.leaveDays' is present");
        console.log("   6. ✅ 'alphaDetails' object is present");
        console.log("   7. ✅ Pre-join dates NOT counted in alpha\n");

        console.log("📝 Manual Testing Steps:");
        console.log("   1. Login to get JWT token");
        console.log("   2. Open browser DevTools (F12)");
        console.log("   3. Navigate to Work Calendar page");
        console.log("   4. Check Network tab for /api/user/calendar request");
        console.log("   5. Verify response structure matches above");
        console.log("   6. Check Console for logs:");
        console.log("      - [AlphaService] logs (backend)");
        console.log("      - 👤 User Info: (frontend)");
        console.log("      - 🔍 Frontend Debug: (frontend)\n");

        console.log(
            "✅ If response matches and no errors → Refactoring successful!\n",
        );

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error:", error.message);
        process.exit(1);
    }
}

testCalendarAPI();
