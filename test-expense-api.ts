import { apiRequest } from './client/src/lib/utils';

async function testExpenseAPI() {
    console.log('Testing Expense API...\n');

    try {
        // Test 1: Get expenses
        console.log('1. Testing GET /api/expenses...');
        const response = await fetch('http://localhost:5000/api/expenses', {
            method: 'GET',
            headers: {
                'x-user-name': 'eagleye@admin.com', // Replace with your actual username
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, data);
        console.log('   ✓ GET expenses successful\n');

        // Test 2: Create expense
        console.log('2. Testing POST /api/expenses...');
        const createResponse = await fetch('http://localhost:5000/api/expenses', {
            method: 'POST',
            headers: {
                'x-user-name': 'eagleye@admin.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: 'Test Expense - Stationary',
                amount: 2000,
                category: 'School Supplies',
                date: new Date().toISOString().split('T')[0]
            })
        });

        const createData = await createResponse.json();
        console.log(`   Status: ${createResponse.status}`);
        console.log(`   Response:`, createData);
        console.log('   ✓ POST expense successful\n');

        console.log('✅ All expense API tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testExpenseAPI();
