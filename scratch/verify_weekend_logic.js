function isWeekend(attendanceDate) {
    const dateParts = attendanceDate.split('-').map(Number);
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayOfWeek = dateObj.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
}

const testDates = [
    { date: '2026-04-11', expected: true, label: 'Today (Saturday)' },
    { date: '2026-04-12', expected: true, label: 'Tomorrow (Sunday)' },
    { date: '2026-04-13', expected: false, label: 'Monday' },
    { date: '2026-04-10', expected: false, label: 'Friday' }
];

testDates.forEach(t => {
    const result = isWeekend(t.date);
    console.log(`Date: ${t.date} (${t.label}) -> weekend: ${result} | ${result === t.expected ? 'PASS' : 'FAIL'}`);
});
