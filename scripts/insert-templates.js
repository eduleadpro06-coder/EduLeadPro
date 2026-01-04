// Insert Default Templates via API
const templates = [
    {
        displayName: "Welcome Message",
        content: "Hello {{name}}, welcome to {{instituteName}}! We are excited to have you join us in {{class}}. For any queries, please contact us.",
        category: "whatsapp",
        isActive: true
    },
    {
        displayName: "Fee Reminder",
        content: "Dear {{parentName}}, this is a friendly reminder that {{name}}'s fee payment of ₹{{amount}} is due on {{dueDate}}. Please make the payment at your earliest convenience. - {{instituteName}}",
        category: "whatsapp",
        isActive: true
    },
    {
        displayName: "Attendance Alert",
        content: "Dear {{parentName}}, {{name}} ({{class}}) was absent today ({{date}}). If this is unexpected, please contact us. - {{instituteName}}",
        category: "whatsapp",
        isActive: true
    },
    {
        displayName: "Payment Confirmation",
        content: "Dear {{parentName}}, we have received your payment of ₹{{amount}} for {{name}} ({{class}}). Receipt number: {{receiptNumber}}. Thank you! - {{instituteName}}",
        category: "whatsapp",
        isActive: true
    },
    {
        displayName: "Admission Confirmation",
        content: "Congratulations {{parentName}}! {{name}}'s admission to {{class}} at {{instituteName}} is confirmed. Registration fee: ₹{{amount}}. Classes start on {{startDate}}.",
        category: "whatsapp",
        isActive: true
    },
    {
        displayName: "Follow-up Message",
        content: "Hello {{name}}, thank you for your interest in {{instituteName}}. This is a follow-up regarding your inquiry for {{class}}. Please let us know if you have any questions!",
        category: "whatsapp",
        isActive: true
    }
];

async function insertTemplates() {
    const baseUrl = 'http://localhost:5000';

    for (const template of templates) {
        try {
            const response = await fetch(`${baseUrl}/api/message-templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-name': 'admin@example.com'
                },
                body: JSON.stringify(template)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✓ Created: ${template.displayName}`);
            } else {
                const error = await response.text();
                console.error(`✗ Failed to create ${template.displayName}:`, error);
            }
        } catch (err) {
            console.error(`✗ Error creating ${template.displayName}:`, err.message);
        }
    }

    console.log('\n✅ Template insertion complete!');
}

insertTemplates().catch(console.error);
