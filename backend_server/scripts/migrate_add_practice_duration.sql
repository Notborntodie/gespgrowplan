-- ============================================
-- 数据库迁移脚本：为提交记录表添加「本次练习持续时间」字段
-- ============================================
-- 说明：
-- 1. 为 submissions 表增加 practice_duration_seconds（单位：秒）
-- 2. 为 oj_submissions 表增加 practice_duration_seconds（单位：秒）
-- 执行前请备份数据库

-- ============================================
-- 1. 修改 submissions 表
-- ============================================
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'submissions' 
               AND column_name = 'practice_duration_seconds');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE submissions ADD COLUMN practice_duration_seconds INT NULL COMMENT ''本次练习持续时间（秒）'' AFTER submit_time', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. 修改 oj_submissions 表
-- ============================================
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'oj_submissions' 
               AND column_name = 'practice_duration_seconds');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE oj_submissions ADD COLUMN practice_duration_seconds INT NULL COMMENT ''本次练习持续时间（秒）'' AFTER submit_time', 
  'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 迁移完成
-- ============================================
