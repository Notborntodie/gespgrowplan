-- ================================================================
-- 数据库迁移脚本：添加 is_displayed 字段到 oj_samples 表
-- 创建时间: 2025-10-16
-- 说明: 
--   - is_hidden: 表示提交后能否展示样例（true=隐藏测试点，提交后不显示详细信息）
--   - is_displayed: 表示用户查看题目时是否展示样例（true=查看时显示，false=查看时不显示）
-- ================================================================

-- 添加 is_displayed 字段
ALTER TABLE oj_samples 
ADD COLUMN is_displayed BOOLEAN DEFAULT TRUE COMMENT '是否在查看题目时展示（true=展示，false=不展示）' 
AFTER is_hidden;

-- 更新注释以更清晰地说明字段含义
ALTER TABLE oj_samples 
MODIFY COLUMN is_hidden BOOLEAN DEFAULT FALSE COMMENT '是否为隐藏测试点（true=提交后不显示详细信息，false=提交后可显示）';

-- 添加索引以优化查询性能
ALTER TABLE oj_samples 
ADD INDEX idx_problem_displayed (problem_id, is_displayed);

-- 验证修改
DESCRIBE oj_samples;

-- 显示更新后的数据
SELECT 
  id,
  problem_id,
  is_hidden,
  is_displayed,
  sort_order
FROM oj_samples
LIMIT 5;

