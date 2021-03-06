CREATE TABLE IF NOT EXISTS access_logs(
  user_id int unsigned NOT NULL,
  entered_at datetime NOT NULL,
  exited_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, entered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
