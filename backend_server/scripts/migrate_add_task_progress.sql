-- ============================================
-- 数据库迁移脚本：增加任务内完成进度支持
-- ============================================
-- 说明：
-- 1. 为 UserExamProgress 和 UserOjProgress 表增加 task_id 字段
-- 2. 修改唯一约束以支持任务内/外区分
-- 3. 新增 UserPlanProgress 表用于记录用户计划完成情况

-- ============================================
-- 1. 修改 user_exam_progress 表
-- ============================================

-- 先删除 user_exam_progress 表上所有外键约束（如果存在）
-- 使用存储过程方式逐个删除所有外键约束
DROP PROCEDURE IF EXISTS drop_fk_user_exam_progress;
DELIMITER //
CREATE PROCEDURE drop_fk_user_exam_progress()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE fk_name VARCHAR(255);
  DECLARE cur CURSOR FOR 
    SELECT CONSTRAINT_NAME 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'user_exam_progress' 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO fk_name;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SET @sqlstmt = CONCAT('ALTER TABLE user_exam_progress DROP FOREIGN KEY ', fk_name);
    PREPARE stmt FROM @sqlstmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END LOOP;
  CLOSE cur;
END//
DELIMITER ;

CALL drop_fk_user_exam_progress();
DROP PROCEDURE IF EXISTS drop_fk_user_exam_progress;

-- 删除旧的唯一约束（如果存在）
-- 注意：如果索引被外键使用，需要先删除外键
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_exam_progress' 
               AND index_name = 'unique_user_exam');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE user_exam_progress DROP INDEX unique_user_exam', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查 task_id 字段是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_exam_progress' 
               AND column_name = 'task_id');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE user_exam_progress ADD COLUMN task_id INT NULL COMMENT ''任务ID（NULL表示非任务内完成）'' AFTER exam_id', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查外键约束是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_exam_progress' 
               AND constraint_name = 'fk_user_exam_progress_task');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE user_exam_progress ADD CONSTRAINT fk_user_exam_progress_task FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查索引是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_exam_progress' 
               AND index_name = 'idx_task_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE user_exam_progress ADD INDEX idx_task_id (task_id)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查新的唯一约束是否已存在，如果不存在则创建
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_exam_progress' 
               AND constraint_name = 'unique_user_exam_task');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE user_exam_progress ADD UNIQUE KEY unique_user_exam_task (user_id, exam_id, task_id)', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. 修改 user_oj_progress 表
-- ============================================

-- 先删除 user_oj_progress 表上所有外键约束（如果存在）
-- 使用存储过程方式逐个删除所有外键约束
DROP PROCEDURE IF EXISTS drop_fk_user_oj_progress;
DELIMITER //
CREATE PROCEDURE drop_fk_user_oj_progress()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE fk_name VARCHAR(255);
  DECLARE cur CURSOR FOR 
    SELECT CONSTRAINT_NAME 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'user_oj_progress' 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO fk_name;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SET @sqlstmt = CONCAT('ALTER TABLE user_oj_progress DROP FOREIGN KEY ', fk_name);
    PREPARE stmt FROM @sqlstmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END LOOP;
  CLOSE cur;
END//
DELIMITER ;

CALL drop_fk_user_oj_progress();
DROP PROCEDURE IF EXISTS drop_fk_user_oj_progress;

-- 删除旧的唯一约束（如果存在）
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_oj_progress' 
               AND index_name = 'unique_user_problem');
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE user_oj_progress DROP INDEX unique_user_problem', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查 task_id 字段是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_oj_progress' 
               AND column_name = 'task_id');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE user_oj_progress ADD COLUMN task_id INT NULL COMMENT ''任务ID（NULL表示非任务内完成）'' AFTER problem_id', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查外键约束是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_oj_progress' 
               AND constraint_name = 'fk_user_oj_progress_task');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE user_oj_progress ADD CONSTRAINT fk_user_oj_progress_task FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查索引是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_oj_progress' 
               AND index_name = 'idx_task_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE user_oj_progress ADD INDEX idx_task_id (task_id)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查新的唯一约束是否已存在，如果不存在则创建
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'user_oj_progress' 
               AND constraint_name = 'unique_user_problem_task');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE user_oj_progress ADD UNIQUE KEY unique_user_problem_task (user_id, problem_id, task_id)', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. 创建 user_plan_progress 表
-- ============================================

CREATE TABLE IF NOT EXISTS user_plan_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  plan_id INT NOT NULL COMMENT '计划ID',
  is_completed BOOLEAN DEFAULT FALSE COMMENT '是否完成',
  completed_tasks INT DEFAULT 0 COMMENT '已完成任务数',
  total_tasks INT DEFAULT 0 COMMENT '总任务数',
  completed_at DATETIME COMMENT '完成时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES learning_plans(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_plan (user_id, plan_id),
  INDEX idx_user_id (user_id),
  INDEX idx_plan_id (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户计划完成进度表';

-- ============================================
-- 4. 数据迁移：为现有记录设置 task_id = NULL
-- ============================================

-- 确保现有记录的 task_id 为 NULL（表示非任务内完成）
UPDATE user_exam_progress SET task_id = NULL WHERE task_id IS NULL;
UPDATE user_oj_progress SET task_id = NULL WHERE task_id IS NULL;

-- ============================================
-- 迁移完成
-- ============================================

