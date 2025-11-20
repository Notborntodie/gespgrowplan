-- 创建提交记录表
CREATE TABLE IF NOT EXISTS oj_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  problem_id INT NOT NULL,
  code TEXT NOT NULL,
  language VARCHAR(20) NOT NULL DEFAULT 'cpp',
  status ENUM('queued', 'judging', 'completed', 'error') NOT NULL DEFAULT 'queued',
  verdict VARCHAR(50) DEFAULT NULL COMMENT 'Accepted, Wrong Answer, Time Limit Exceeded, etc.',
  total_tests INT DEFAULT 0,
  passed_tests INT DEFAULT 0,
  results JSON DEFAULT NULL COMMENT '每个测试点的详细结果',
  error_message TEXT DEFAULT NULL,
  submit_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  judge_start_time DATETIME DEFAULT NULL,
  judge_end_time DATETIME DEFAULT NULL,
  judge_duration INT DEFAULT NULL COMMENT '判题耗时（毫秒）',
  user_id INT DEFAULT NULL COMMENT '用户ID（预留）',
  ip_address VARCHAR(50) DEFAULT NULL,
  INDEX idx_problem_id (problem_id),
  INDEX idx_status (status),
  INDEX idx_submit_time (submit_time),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (problem_id) REFERENCES oj_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='OJ提交记录表';

-- 添加统计视图（可选）
CREATE OR REPLACE VIEW oj_submission_stats AS
SELECT 
  problem_id,
  COUNT(*) as total_submissions,
  SUM(CASE WHEN verdict = 'Accepted' THEN 1 ELSE 0 END) as accepted_count,
  ROUND(SUM(CASE WHEN verdict = 'Accepted' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as acceptance_rate,
  AVG(judge_duration) as avg_judge_duration
FROM oj_submissions
WHERE status = 'completed'
GROUP BY problem_id;

