-- Create message_templates table for storing WhatsApp/SMS/Email templates
CREATE TABLE IF NOT EXISTS message_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'whatsapp',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  variables TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default WhatsApp templates
INSERT INTO message_templates (name, display_name, content, category, is_active, is_default, variables) VALUES
('welcome', 'Welcome Message', 'Hi {name}! 👋

Thank you for your interest in {instituteName}!

We''re excited to help you with admission to {class}. Our team is here to guide you through the entire process.

*What''s Next?*
📞 Our counselor will contact you shortly
📋 We''ll discuss course details and fee structure
✅ Help you with the admission process

Feel free to reach out if you have any questions!

Best regards,
{instituteName} Team', 'whatsapp', true, true, '["name", "class", "instituteName"]'),

('followup', 'Follow-up', 'Hello {name}! 🎓

This is a follow-up regarding your {class} admission inquiry at {instituteName}.

*Quick Update:*
• Your inquiry is being reviewed
• We''d love to schedule a counseling session with you
• Best time to discuss: Your convenience

*What we''ll cover in the session:*
✓ Course curriculum and  teaching methodology
✓ Fee structure and payment options
✓ Admission process and timeline
✓ Career opportunities

Would you like to schedule a call? Please share your preferred date and time.

Thanks,
{instituteName} Team', 'whatsapp', true, true, '["name", "class", "instituteName"]'),

('documents', 'Document Request', 'Hi {name}! 📄

To proceed with your {class} admission at {instituteName}, please share the following documents:

*Required Documents:*
1. ✅ Latest marksheet/report card
2. ✅ Transfer certificate (if applicable)
3. ✅ Aadhaar card copy (student)
4. ✅ Birth certificate
5. ✅ Parent''s Aadhaar card copy
6. ✅ Recent passport-size photographs (3 copies)
7. ✅ Caste certificate (if applicable)

*How to submit:*
📧 Email: [your-email]
📱 WhatsApp: {phone}
🏢 Visit: Our campus office

Please submit at your earliest convenience to secure your seat!

Thanks,
{instituteName} Team', 'whatsapp', true, true, '["name", "class", "instituteName", "phone"]'),

('reminder', 'Meeting Reminder', 'Dear {name}! ⏰

*Counseling Session Reminder*

This is a reminder about your scheduled counseling session for {class} admission at {instituteName}.

*Session Details:*
📅 Date: [Please specify date]
🕐 Time: [Please specify time]
📍 Venue: {instituteName} Campus / Online
👤 Counselor: [Counselor name]

*Please bring:*
• Academic documents
• Questions/queries about the course
• Parent/Guardian (if required)

Looking forward to meeting you!

In case you need to reschedule, please let us know.

Best regards,
{instituteName} Team', 'whatsapp', true, true, '["name", "class", "instituteName"]'),

('fees', 'Fee Information', 'Hi {name}! 💰

Here''s the fee structure for {class} at {instituteName}:

*Fee Breakdown:*
📚 Tuition Fees: ₹[Amount]
📖 Books & Materials: ₹[Amount]
🏫 Development Fee: ₹[Amount]
🎒 Other Charges: ₹[Amount]
━━━━━━━━━━━━━━
💵 *Total Annual Fee: ₹[Total Amount]*

*Payment Options:*
✓ One-time payment (discount available)
✓ Installment plans (Quarterly/Monthly)
✓ EMI facility available
✓ Multiple payment modes accepted

*Scholarships & Discounts:*
🎓 Merit-based scholarship available
👨‍👩‍👧 Sibling discount: 10%
⚡ Early bird discount (if applicable)

For detailed fee structure and payment plans, please visit our office or schedule a call.

Need clarification? Feel free to ask!

Thanks,
{instituteName} Team', 'whatsapp', true, true, '["name", "class", "instituteName"]'),

('custom', 'Custom Message', '', 'whatsapp', true, true, '["name", "class", "instituteName", "phone", "email"]');
