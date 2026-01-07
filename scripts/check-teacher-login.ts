import { db } from '../server/db';
import { staff } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkTeacherLogin() {
    try {
        const phone = '8698595526';

        console.log('Checking staff table for phone:', phone);

        const result = await db
            .select()
            .from(staff)
            .where(eq(staff.phone, phone));

        console.log('Found staff:', JSON.stringify(result, null, 2));

        if (result.length > 0) {
            const teacher = result[0];
            console.log('\nTeacher Details:');
            console.log('- Name:', teacher.name);
            console.log('- Phone:', teacher.phone);
            console.log('- Role:', teacher.role);
            console.log('- Is Active:', teacher.isActive);
            console.log('- Organization ID:', teacher.organizationId);
        } else {
            console.log('❌ No staff found with this phone number');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTeacherLogin();
