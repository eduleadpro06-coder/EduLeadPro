
const fs = require('fs');

function checkFile(path, checks) {
    try {
        const content = fs.readFileSync(path, 'utf8');
        console.log(`Checking ${path}...`);
        let allPassed = true;
        for (const check of checks) {
            if (content.includes(check)) {
                console.log(`  [PASS] Found: "${check}"`);
            } else {
                console.log(`  [FAIL] Missing: "${check}"`);
                allPassed = false;
            }
        }
        return allPassed;
    } catch (e) {
        console.log(`  [ERROR] Could not read ${path}: ${e.message}`);
        return false;
    }
}

const checks = [
    {
        path: 'server/routes.ts',
        checks: [
            '/api/organization/settings',
            'academicYear = "2026-27"'
        ]
    },
    {
        path: 'client/src/hooks/use-organization.tsx',
        checks: [
            'export function useOrganization()',
            'academicYear: settings?.academicYear || "2026-27"'
        ]
    },
    {
        path: 'client/src/pages/settings.tsx',
        checks: [
            'useOrganization',
            'updateSettings({ academicYear: value })'
        ]
    },
    {
        path: 'client/src/pages/student-fees.tsx',
        checks: [
            'useOrganization',
            'const { academicYear: globalAcademicYear } = useOrganization()',
            'setAcademicYear(globalAcademicYear)'
        ]
    }
];

let success = true;
for (const item of checks) {
    if (!checkFile(item.path, item.checks)) {
        success = false;
    }
}

if (success) {
    console.log("\nAll checks passed!");
} else {
    console.log("\nSome checks failed.");
    process.exit(1);
}
