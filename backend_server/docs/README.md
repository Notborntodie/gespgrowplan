# 文档目录

本目录包含GESP练习系统后端服务器的相关文档和SQL脚本。

## 文档列表

### API文档
- **DATABASE_STRUCTURE.md** - 数据库结构说明
- **QUESTION_API.md** - 题目管理API文档
- **SUBMISSION_API_DOCUMENTATION.md** - 提交管理API文档
- **API_CHANGES.md** - API变更记录

### SQL脚本
- **create_wrong_questions_view.sql** - 创建错题视图
- **update.sql** - 数据库更新脚本
- **update_database.sql** - 数据库结构更新脚本

## 文档说明

### DATABASE_STRUCTURE.md
详细描述了数据库的表结构、字段定义、索引和关系。

### QUESTION_API.md
题目管理相关的API接口文档，包括：
- 获取题目列表
- 创建题目
- 更新题目
- 删除题目
- 题目上传

### SUBMISSION_API_DOCUMENTATION.md
考试提交相关的API接口文档，包括：
- 提交考试答案
- 获取提交记录
- 成绩统计
- 错题分析

### API_CHANGES.md
记录API接口的变更历史，包括：
- 新增接口
- 修改接口
- 废弃接口
- 版本更新

## SQL脚本说明

### create_wrong_questions_view.sql
创建错题统计视图，用于分析用户的错题情况。

### update.sql
数据库结构和数据的更新脚本。

### update_database.sql
数据库结构的完整更新脚本，包含所有必要的变更。

## 使用说明

1. 在修改数据库结构前，请先查看相关文档
2. 执行SQL脚本前，请备份数据库
3. API变更时，请更新相应的文档
4. 新增功能时，请及时补充文档

## 维护指南

- 定期更新API文档
- 记录重要的数据库变更
- 保持文档的准确性和时效性
- 及时归档过时的文档

