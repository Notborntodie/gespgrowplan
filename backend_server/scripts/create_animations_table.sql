-- ================================================================
-- 动画演示表
-- 用于存储老师上传的HTML动画文件信息
-- ================================================================

CREATE TABLE IF NOT EXISTS `animations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL COMMENT '动画标题',
  `description` text COMMENT '动画描述',
  `file_path` varchar(500) NOT NULL COMMENT 'HTML文件路径（相对于public/html）',
  `file_name` varchar(255) NOT NULL COMMENT '原始文件名',
  `category` varchar(100) DEFAULT NULL COMMENT '分类（如：DFS、BFS等）',
  `icon` varchar(50) DEFAULT 'play-circle' COMMENT '图标名称',
  `uploader_id` int NOT NULL COMMENT '上传者ID（教师）',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否激活（1=是，0=否）',
  `view_count` int DEFAULT '0' COMMENT '查看次数',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_uploader_id` (`uploader_id`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `animations_ibfk_1` FOREIGN KEY (`uploader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='动画演示表';
