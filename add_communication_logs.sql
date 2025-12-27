CREATE TABLE IF NOT EXISTS communication_logs (
  id SERIAL PRIMARY KEY,
  recipient_type VARCHAR(20) NOT NULL,
  recipient_id INTEGER,
  group_name VARCHAR(100),
  type VARCHAR(20) NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);
