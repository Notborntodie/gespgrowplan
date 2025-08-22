# GESP 练习系统数据库结构文档

## 概述

GESP练习系统采用关系型数据库设计，支持题目管理、考试管理、用户管理、知识点管理等功能。数据库采用多对多关系设计，实现题目复用和灵活组合。

## 数据库信息

- **数据库名**: `gesp_practice_system`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`
- **题目总数**: 1
- **考试总数**: 1

## 表结构详情

### 1. 用户表 (users)

**功能**: 存储系统用户信息

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 用户ID，主键 |
| username | varchar(50) | NO | - | 用户名，唯一 |
| password | varchar(255) | NO | - | 密码 |
| phone | varchar(20) | YES | NULL | 手机号 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE KEY (username)

### 2. 考试表 (exams)

**功能**: 存储考试基本信息

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 考试ID，主键 |
| name | varchar(100) | NO | - | 考试名称 |
| level | int | NO | - | 考试等级 |
| description | text | YES | NULL | 考试描述 |
| total_questions | int | NO | - | 题目总数 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)

### 3. 题目表 (questions)

**功能**: 存储题目基本信息（独立于考试）

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 题目ID，主键 |
| question_text | text | NO | - | 题目文本内容 |
| question_type | enum('text','code') | YES | 'text' | 题目类型 |
| question_code | text | YES | NULL | 题目代码内容 |
| correct_answer | varchar(10) | NO | - | 正确答案 |
| explanation | text | YES | NULL | 解释说明 |
| level | int | NO | 1 | 题目等级 |
| difficulty | enum('easy','medium','hard') | YES | 'medium' | 题目难度 |
| image_url | varchar(500) | YES | NULL | 题目图片URL |
| question_date | varchar(7) | YES | NULL | 题目时间(YYYY-MM) |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- INDEX idx_questions_level (level)
- INDEX idx_questions_date (question_date)

### 4. 考试-题目关联表 (exam_questions)

**功能**: 管理考试和题目的多对多关系

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 关联ID，主键 |
| exam_id | int | NO | - | 考试ID，外键 |
| question_id | int | NO | - | 题目ID，外键 |
| question_number | int | NO | - | 题目在考试中的编号 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- FOREIGN KEY (exam_id) REFERENCES exams(id)
- FOREIGN KEY (question_id) REFERENCES questions(id)
- UNIQUE KEY (exam_id, question_id)
- UNIQUE KEY (exam_id, question_number)

### 5. 选项表 (options)

**功能**: 存储题目的选项信息

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 选项ID，主键 |
| question_id | int | NO | - | 题目ID，外键 |
| option_label | varchar(10) | NO | - | 选项标签(A,B,C,D) |
| option_value | varchar(10) | NO | - | 选项值 |
| option_text | text | NO | - | 选项文本 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- FOREIGN KEY (question_id) REFERENCES questions(id)
- UNIQUE KEY (question_id, option_label)

### 6. 知识点表 (knowledge_points)

**功能**: 存储知识点信息

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 知识点ID，主键 |
| name | varchar(100) | NO | - | 知识点名称 |
| description | text | YES | NULL | 知识点描述 |
| category | varchar(50) | NO | - | 知识点分类 |
| level | int | NO | 1 | 适用等级 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- UNIQUE KEY (name, level)
- INDEX idx_knowledge_points_category (category)
- INDEX idx_knowledge_points_level (level)

### 7. 题目-知识点关联表 (question_knowledge_points)

**功能**: 管理题目和知识点的多对多关系

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 关联ID，主键 |
| question_id | int | NO | - | 题目ID，外键 |
| knowledge_point_id | int | NO | - | 知识点ID，外键 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- FOREIGN KEY (question_id) REFERENCES questions(id)
- FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id)
- UNIQUE KEY (question_id, knowledge_point_id)

### 8. 题目图片表 (question_images)

**功能**: 存储题目的多张图片

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 图片ID，主键 |
| question_id | int | NO | - | 题目ID，外键 |
| image_url | varchar(500) | NO | - | 图片URL |
| image_type | enum('question','explanation','hint') | YES | 'question' | 图片类型 |
| display_order | int | YES | 0 | 显示顺序 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- FOREIGN KEY (question_id) REFERENCES questions(id)
- INDEX idx_question_images_question (question_id)

### 9. 题目上传记录表 (question_uploads)

**功能**: 记录题目上传历史

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 记录ID，主键 |
| user_id | int | NO | - | 上传用户ID，外键 |
| question_id | int | NO | - | 题目ID，外键 |
| upload_type | enum('manual','batch','import') | YES | 'manual' | 上传方式 |
| upload_status | enum('pending','approved','rejected') | YES | 'pending' | 审核状态 |
| review_notes | text | YES | NULL | 审核备注 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | timestamp | YES | CURRENT_TIMESTAMP | 更新时间 |

**索引**:
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id)
- FOREIGN KEY (question_id) REFERENCES questions(id)
- INDEX idx_question_uploads_status (upload_status)

### 10. 答题记录表 (submissions)

**功能**: 存储用户的答题记录

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 记录ID，主键 |
| user_id | int | NO | - | 用户ID，外键 |
| exam_id | int | NO | - | 考试ID，外键 |
| attempt_number | int | NO | - | 尝试次数 |
| score | int | NO | - | 得分 |
| submit_time | timestamp | YES | CURRENT_TIMESTAMP | 提交时间 |

**索引**:
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id)
- FOREIGN KEY (exam_id) REFERENCES exams(id)
- UNIQUE KEY (user_id, exam_id, attempt_number)

### 11. 答题详情表 (submission_answers)

**功能**: 存储每道题的答题详情

| 字段名 | 类型 | 是否为空 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | NO | auto_increment | 详情ID，主键 |
| submission_id | int | NO | - | 答题记录ID，外键 |
| question_id | int | NO | - | 题目ID，外键 |
| user_answer | varchar(10) | NO | - | 用户答案 |
| is_correct | boolean | NO | - | 是否正确 |
| created_at | timestamp | YES | CURRENT_TIMESTAMP | 创建时间 |

**索引**:
- PRIMARY KEY (id)
- FOREIGN KEY (submission_id) REFERENCES submissions(id)
- FOREIGN KEY (question_id) REFERENCES questions(id)

## 视图 (Views)

### 1. 题目详情视图 (question_details)

**功能**: 提供题目的完整信息视图

```sql
SELECT 
    q.id,
    q.question_text,
    q.question_type,
    q.question_code,
    q.correct_answer,
    q.explanation,
    q.level,
    q.difficulty,
    q.image_url,
    q.question_date,
    q.created_at,
    q.updated_at
FROM questions q
```

### 2. 题目详情视图(含知识点) (question_details_with_knowledge)

**功能**: 提供题目及其关联知识点的完整信息

```sql
SELECT 
    q.id,
    q.question_text,
    q.question_type,
    q.question_code,
    q.correct_answer,
    q.explanation,
    q.level,
    q.difficulty,
    q.image_url,
    q.question_date,
    q.created_at,
    q.updated_at,
    GROUP_CONCAT(DISTINCT kp.name ORDER BY kp.name SEPARATOR ', ') as knowledge_points,
    GROUP_CONCAT(DISTINCT kp.category ORDER BY kp.category SEPARATOR ', ') as knowledge_categories
FROM questions q
LEFT JOIN question_knowledge_points qkp ON q.id = qkp.question_id
LEFT JOIN knowledge_points kp ON qkp.knowledge_point_id = kp.id
GROUP BY q.id
```

### 3. 知识点统计视图 (knowledge_point_stats)

**功能**: 提供知识点的使用统计信息

### 4. 答题统计视图 (submission_stats)

**功能**: 提供答题记录统计信息

## 设计特点

### 1. 多对多关系设计
- **题目-考试**: 通过 `exam_questions` 表实现，支持题目复用
- **题目-知识点**: 通过 `question_knowledge_points` 表实现，支持多知识点标注

### 2. 数据独立性
- 题目表独立于考试表，支持题目库管理
- 用户表独立于其他业务表，支持用户管理

### 3. 扩展性
- 支持题目多图片
- 支持知识点分类管理
- 支持题目上传审核流程

### 4. 性能优化
- 关键字段建立索引
- 使用视图简化复杂查询
- 合理的表结构设计

## 数据关系图

```
users (用户)
    ↓
submissions (答题记录) → exams (考试)
    ↓
submission_answers (答题详情) → questions (题目)
                                    ↓
                            options (选项)
                            question_images (题目图片)
                            question_knowledge_points (题目-知识点关联)
                                    ↓
                            knowledge_points (知识点)
```

## 使用建议

1. **题目管理**: 通过 `questions` 表管理题目库，支持按等级、难度、时间筛选
2. **考试创建**: 通过 `exam_questions` 表将题目组合成考试
3. **知识点管理**: 通过 `knowledge_points` 和 `question_knowledge_points` 管理知识点
4. **统计分析**: 通过视图和统计表进行数据分析

---

*文档更新时间: 2025-01-16*
*数据库版本: gesp_practice_system*
