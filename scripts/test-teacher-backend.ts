// Quick test to verify backend is checking staff table
import { supabase } from './server/db';

async function testTeacherLogin() {
    const phone = '8698595526';
    const password = '8698595526'; // or '1234'

    console.log('Testing teacher login backend...');
    console.log('Phone:', phone);

    // This is what the backend SHOULD be doing
    const { data: staffMembers, error } = await supabase
        .from('staff')
        .select('id, name, phone, role, organization_id, email, app_password')
        .eq('phone', phone)
        .eq('is_active', true);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found staff:', staffMembers);

    if (staffMembers && staffMembers.length > 0) {
        const staff = staffMembers[0];
        console.log('\n✅ Staff found!');
        console.log('Name:', staff.name);
        console.log('Role:', staff.role);
        console.log('Has app_password:', !!staff.app_password);

        const isValidPassword = staff.app_password
            ? password === staff.app_password
            : (password === phone || password === '1234');

        console.log('Password valid:', isValidPassword);
    } else {
        console.log('❌ No staff found');
    }
}

testTeacherLogin();
