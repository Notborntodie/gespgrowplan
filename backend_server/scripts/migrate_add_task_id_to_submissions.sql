-- ============================================
-- 数据库迁移脚本：为提交记录表添加 task_id 字段
-- ============================================
-- 说明：
-- 1. 为 submissions 表增加 task_id 字段（可选，NULL表示非任务内提交）
-- 2. 为 oj_submissions 表增加 task_id 字段（可选，NULL表示非任务内提交）
-- 3. 添加外键约束和索引

-- ============================================
-- 1. 修改 submissions 表
-- ============================================

-- 检查 task_id 字段是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'submissions' 
               AND column_name = 'task_id');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE submissions ADD COLUMN task_id INT NULL COMMENT ''任务ID（NULL表示非任务内提交）'' AFTER exam_id', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查外键约束是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'submissions' 
               AND constraint_name = 'fk_submissions_task');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE submissions ADD CONSTRAINT fk_submissions_task FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE SET NULL', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查索引是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'submissions' 
               AND index_name = 'idx_submissions_task_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE submissions ADD INDEX idx_submissions_task_id (task_id)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. 修改 oj_submissions 表
-- ============================================

-- 检查 task_id 字段是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'oj_submissions' 
               AND column_name = 'task_id');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE oj_submissions ADD COLUMN task_id INT NULL COMMENT ''任务ID（NULL表示非任务内提交）'' AFTER problem_id', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查外键约束是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'oj_submissions' 
               AND constraint_name = 'fk_oj_submissions_task');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE oj_submissions ADD CONSTRAINT fk_oj_submissions_task FOREIGN KEY (task_id) REFERENCES learning_tasks(id) ON DELETE SET NULL', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查索引是否已存在，如果不存在则添加
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'oj_submissions' 
               AND index_name = 'idx_oj_submissions_task_id');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE oj_submissions ADD INDEX idx_oj_submissions_task_id (task_id)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 迁移完成
-- ============================================

