-- ================================================================
-- 批量更新 OJ 样例的 is_displayed 和 is_hidden 字段
-- 创建时间: 2025-10-16
-- 
-- 规则：
-- 1. 第一个样例点（按 sort_order）：is_displayed = TRUE（查看时可见）
-- 2. 其他样例点：is_displayed = FALSE（查看时不可见）
-- 3. 后两个样例点（按 sort_order）：is_hidden = TRUE（提交后不显示详细信息）
-- 4. 其他样例点：is_hidden = FALSE（提交后可显示详细信息）
-- ================================================================

-- 先重置所有样例为默认值
UPDATE oj_samples 
SET is_displayed = FALSE, is_hidden = FALSE;

-- 设置第一个样例为 is_displayed = TRUE
-- 使用子查询找出每个题目的第一个样例
UPDATE oj_samples s
INNER JOIN (
  SELECT 
    id,
    problem_id,
    sort_order,
    ROW_NUMBER() OVER (PARTITION BY problem_id ORDER BY sort_order ASC, id ASC) as row_num
  FROM oj_samples
) ranked ON s.id = ranked.id
SET s.is_displayed = TRUE
WHERE ranked.row_num = 1;

-- 设置后两个样例为 is_hidden = TRUE
-- 使用子查询找出每个题目的后两个样例
UPDATE oj_samples s
INNER JOIN (
  SELECT 
    id,
    problem_id,
    sort_order,
    ROW_NUMBER() OVER (PARTITION BY problem_id ORDER BY sort_order DESC, id DESC) as row_num
  FROM oj_samples
) ranked ON s.id = ranked.id
SET s.is_hidden = TRUE
WHERE ranked.row_num <= 2;

-- 验证更新结果
SELECT 
  '第一个样例 (is_displayed=TRUE)' as category,
  COUNT(*) as count
FROM oj_samples
WHERE is_displayed = TRUE

UNION ALL

SELECT 
  '后两个样例 (is_hidden=TRUE)' as category,
  COUNT(*) as count
FROM oj_samples
WHERE is_hidden = TRUE

UNION ALL

SELECT 
  '总样例数' as category,
  COUNT(*) as count
FROM oj_samples;

-- 查看几个题目的样例分布示例
SELECT 
  problem_id,
  id,
  sort_order,
  is_displayed,
  is_hidden,
  SUBSTRING(input, 1, 20) as input_preview,
  SUBSTRING(output, 1, 20) as output_preview
FROM oj_samples
WHERE problem_id IN (4, 5, 6)
ORDER BY problem_id, sort_order, id;

