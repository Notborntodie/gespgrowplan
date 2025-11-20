-- ============================================
-- 学习计划系统数据表初始化脚本
-- ============================================

-- 1. 学习计划表
CREATE TABLE IF NOT EXISTS learning_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT '计划名称',
  description TEXT COMMENT '计划描述',
  level INT NOT NULL COMMENT 'GESP级别(1-4)',
  start_time DATETIME NOT NULL COMMENT '开始时间',
  end_time DATETIME NOT NULL COMMENT '结束时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT COMMENT '创建者ID',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  INDEX idx_level (level),
  INDEX idx_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习计划表';

-- 2. 学习任务表
CREATE TABLE IF NOT EXISTS learning_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plan_id INT NOT NULL COMMENT '所属计划ID',
  name VARCHAR(255) NOT NULL COMMENT '任务名称',
  description TEXT COMMENT '任务描述',
  review_content TEXT COMMENT '复习内容（文本）',
  review_video_url VARCHAR(500) COMMENT '复习视频链接',
  start_time DATETIME NOT NULL COMMENT '开始时间',
  end_time DATETIME NOT NULL COMMENT '结束时间',
  task_order INT DEFAULT 0 COMMENT '任务顺序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES learning_plans(id) ON DELETE CASCADE,
  INDEX idx_plan_id (plan_id),
  INDEX idx_order (task_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习任务表';

-- 3. 任务-客观题关联表
CREATE TABLE IF NOT EXISTS task_exams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL COMMENT '任务ID',
  exam_id INT NOT NULL COMMENT '考试ID',
  exam_order INT DEFAULT 0 COMMENT '练习顺序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  UNIQUE KEY uk_task_exam (task_id, exam_id),
  INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务-客观题关联表';

-- 4. 任务-OJ题关联表
CREATE TABLE IF NOT EXISTS task_oj_problems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL COMMENT '任务ID',
  problem_id INT NOT NULL COMMENT 'OJ题目ID',
  problem_order INT DEFAULT 0 COMMENT '题目顺序',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES oj_problems(id) ON DELETE CASCADE,
  UNIQUE KEY uk_task_problem (task_id, problem_id),
  INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务-OJ题关联表';

-- 5. 用户加入的计划表
CREATE TABLE IF NOT EXISTS user_learning_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  plan_id INT NOT NULL COMMENT '计划ID',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  status VARCHAR(50) DEFAULT 'active' COMMENT '状态: active/completed/cancelled',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES learning_plans(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_plan (user_id, plan_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户加入的计划表';

-- 6. 用户任务完成进度表
CREATE TABLE IF NOT EXISTS user_task_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  task_id INT NOT NULL COMMENT '任务ID',
  is_completed BOOLEAN DEFAULT FALSE COMMENT '是否完成',
  completed_at DATETIME COMMENT '完成时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_task (user_id, task_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户任务完成进度表';

