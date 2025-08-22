#!/bin/bash

# API配置
API_BASE_URL="http://localhost:3000"

echo "🚀 开始测试批量上传代码题API..."
echo "=================================="

# 测试1: 批量上传简单的代码题
echo "📝 测试1: 批量上传简单的代码题"
echo "----------------------------------"
curl -X POST "${API_BASE_URL}/api/upload-questions-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "question_text": "以下哪个函数能正确计算两个整数的和？",
        "question_type": "code",
        "question_code": "def add_numbers(a, b):\n    # 在这里编写代码\n    pass",
        "correct_answer": "A",
        "explanation": "选项A是正确的加法函数实现，直接返回两个参数的和",
        "level": 1,
        "difficulty": "easy",
        "options": [
          {
            "label": "A",
            "value": "A",
            "text": "def add_numbers(a, b):\n    return a + b"
          },
          {
            "label": "B",
            "value": "B", 
            "text": "def add_numbers(a, b):\n    return a - b"
          },
          {
            "label": "C",
            "value": "C",
            "text": "def add_numbers(a, b):\n    return a * b"
          },
          {
            "label": "D",
            "value": "D",
            "text": "def add_numbers(a, b):\n    return a / b"
          }
        ]
      },
      {
        "question_text": "以下哪个函数能正确反转字符串？",
        "question_type": "code",
        "question_code": "def reverse_string(s):\n    # 在这里编写代码\n    pass",
        "correct_answer": "B",
        "explanation": "选项B使用Python的切片语法可以轻松反转字符串",
        "level": 1,
        "difficulty": "easy",
        "options": [
          {
            "label": "A",
            "value": "A",
            "text": "def reverse_string(s):\n    return s"
          },
          {
            "label": "B",
            "value": "B",
            "text": "def reverse_string(s):\n    return s[::-1]"
          },
          {
            "label": "C",
            "value": "C",
            "text": "def reverse_string(s):\n    return s[::1]"
          },
          {
            "label": "D",
            "value": "D",
            "text": "def reverse_string(s):\n    return s[0:len(s)]"
          }
        ]
      }
    ]
  }' \
  -w "\n状态码: %{http_code}\n响应时间: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "响应内容: $(curl -s -X POST "${API_BASE_URL}/api/upload-questions-batch" -H "Content-Type: application/json" -d '{"questions": [{"question_text": "以下哪个函数能正确计算两个整数的和？", "question_type": "code", "question_code": "def add_numbers(a, b):\n    # 在这里编写代码\n    pass", "correct_answer": "A", "explanation": "选项A是正确的加法函数实现，直接返回两个参数的和", "level": 1, "difficulty": "easy", "options": [{"label": "A", "value": "A", "text": "def add_numbers(a, b):\n    return a + b"}, {"label": "B", "value": "B", "text": "def add_numbers(a, b):\n    return a - b"}, {"label": "C", "value": "C", "text": "def add_numbers(a, b):\n    return a * b"}, {"label": "D", "value": "D", "text": "def add_numbers(a, b):\n    return a / b"}]}, {"question_text": "以下哪个函数能正确反转字符串？", "question_type": "code", "question_code": "def reverse_string(s):\n    # 在这里编写代码\n    pass", "correct_answer": "B", "explanation": "选项B使用Python的切片语法可以轻松反转字符串", "level": 1, "difficulty": "easy", "options": [{"label": "A", "value": "A", "text": "def reverse_string(s):\n    return s"}, {"label": "B", "value": "B", "text": "def reverse_string(s):\n    return s[::-1]"}, {"label": "C", "value": "C", "text": "def reverse_string(s):\n    return s[::1]"}, {"label": "D", "value": "D", "text": "def reverse_string(s):\n    return s[0:len(s)]"}]}]}')"

echo -e "\n"

# 测试2: 批量上传包含选项的代码题
echo "📝 测试2: 批量上传包含选项的代码题"
echo "----------------------------------"
curl -X POST "${API_BASE_URL}/api/upload-questions-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "question_text": "以下哪个函数能正确计算斐波那契数列的第n项？",
        "question_type": "code",
        "question_code": "# 请选择正确的斐波那契函数实现",
        "correct_answer": "B",
        "explanation": "选项B使用迭代方法，避免了递归的重复计算，是最高效的实现",
        "level": 2,
        "difficulty": "medium",
        "options": [
          {
            "label": "A",
            "value": "A",
            "text": "递归实现（会导致栈溢出）"
          },
          {
            "label": "B", 
            "value": "B",
            "text": "迭代实现（正确答案）"
          },
          {
            "label": "C",
            "value": "C", 
            "text": "数组实现（空间复杂度高）"
          },
          {
            "label": "D",
            "value": "D",
            "text": "数学公式实现（精度问题）"
          }
        ]
      },
      {
        "question_text": "以下哪个函数能正确判断一个数是否为质数？",
        "question_type": "code",
        "question_code": "def is_prime(n):\n    # 在这里编写代码\n    pass",
        "correct_answer": "C",
        "explanation": "选项C是正确的质数判断算法：1. 小于2的数不是质数 2. 2是质数 3. 偶数（除了2）不是质数 4. 对于奇数，检查是否能被3到sqrt(n)之间的奇数整除",
        "level": 3,
        "difficulty": "hard",
        "options": [
          {
            "label": "A",
            "value": "A",
            "text": "def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, n):\n        if n % i == 0:\n            return False\n    return True"
          },
          {
            "label": "B",
            "value": "B",
            "text": "def is_prime(n):\n    if n < 2:\n        return False\n    if n == 2:\n        return True\n    for i in range(2, n):\n        if n % i == 0:\n            return False\n    return True"
          },
          {
            "label": "C",
            "value": "C",
            "text": "def is_prime(n):\n    if n < 2:\n        return False\n    if n == 2:\n        return True\n    if n % 2 == 0:\n        return False\n    for i in range(3, int(n**0.5) + 1, 2):\n        if n % i == 0:\n            return False\n    return True"
          },
          {
            "label": "D",
            "value": "D",
            "text": "def is_prime(n):\n    return n > 1 and all(n % i != 0 for i in range(2, int(n**0.5) + 1))"
          }
        ]
      }
    ]
  }' \
  -w "\n状态码: %{http_code}\n响应时间: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "响应内容: $(curl -s -X POST "${API_BASE_URL}/api/upload-questions-batch" -H "Content-Type: application/json" -d '{"questions": [{"question_text": "以下哪个函数能正确计算斐波那契数列的第n项？", "question_type": "code", "question_code": "# 请选择正确的斐波那契函数实现", "correct_answer": "B", "explanation": "选项B使用迭代方法，避免了递归的重复计算，是最高效的实现", "level": 2, "difficulty": "medium", "options": [{"label": "A", "value": "A", "text": "递归实现（会导致栈溢出）"}, {"label": "B", "value": "B", "text": "迭代实现（正确答案）"}, {"label": "C", "value": "C", "text": "数组实现（空间复杂度高）"}, {"label": "D", "value": "D", "text": "数学公式实现（精度问题）"}]}, {"question_text": "以下哪个函数能正确判断一个数是否为质数？", "question_type": "code", "question_code": "def is_prime(n):\n    # 在这里编写代码\n    pass", "correct_answer": "C", "explanation": "选项C是正确的质数判断算法：1. 小于2的数不是质数 2. 2是质数 3. 偶数（除了2）不是质数 4. 对于奇数，检查是否能被3到sqrt(n)之间的奇数整除", "level": 3, "difficulty": "hard", "options": [{"label": "A", "value": "A", "text": "def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, n):\n        if n % i == 0:\n            return False\n    return True"}, {"label": "B", "value": "B", "text": "def is_prime(n):\n    if n < 2:\n        return False\n    if n == 2:\n        return True\n    for i in range(2, n):\n        if n % i == 0:\n            return False\n    return True"}, {"label": "C", "value": "C", "text": "def is_prime(n):\n    if n < 2:\n        return False\n    if n == 2:\n        return True\n    if n % 2 == 0:\n        return False\n    for i in range(3, int(n**0.5) + 1, 2):\n        if n % i == 0:\n            return False\n    return True"}, {"label": "D", "value": "D", "text": "def is_prime(n):\n    return n > 1 and all(n % i != 0 for i in range(2, int(n**0.5) + 1))"}]}]}')"

echo -e "\n"

# 测试3: 批量上传复杂算法题
echo "📝 测试3: 批量上传复杂算法题"
echo "----------------------------------"
curl -X POST "${API_BASE_URL}/api/upload-questions-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "question_text": "以下哪个排序算法的时间复杂度是O(n log n)？",
        "question_type": "code",
        "question_code": "# 请选择时间复杂度为O(n log n)的排序算法",
        "correct_answer": "B",
        "explanation": "快速排序的平均时间复杂度是O(n log n)，虽然最坏情况是O(n²)，但平均情况下是最常用的高效排序算法",
        "level": 4,
        "difficulty": "hard",
        "options": [
          {
            "label": "A",
            "value": "A",
            "text": "冒泡排序（O(n²)）"
          },
          {
            "label": "B",
            "value": "B",
            "text": "快速排序（O(n log n)）"
          },
          {
            "label": "C",
            "value": "C",
            "text": "选择排序（O(n²)）"
          },
          {
            "label": "D",
            "value": "D",
            "text": "插入排序（O(n²)）"
          }
        ]
      }
    ]
  }' \
  -w "\n状态码: %{http_code}\n响应时间: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "响应内容: $(curl -s -X POST "${API_BASE_URL}/api/upload-questions-batch" -H "Content-Type: application/json" -d '{"questions": [{"question_text": "以下哪个排序算法的时间复杂度是O(n log n)？", "question_type": "code", "question_code": "# 请选择时间复杂度为O(n log n)的排序算法", "correct_answer": "B", "explanation": "快速排序的平均时间复杂度是O(n log n)，虽然最坏情况是O(n²)，但平均情况下是最常用的高效排序算法", "level": 4, "difficulty": "hard", "options": [{"label": "A", "value": "A", "text": "冒泡排序（O(n²)）"}, {"label": "B", "value": "B", "text": "快速排序（O(n log n)）"}, {"label": "C", "value": "C", "text": "选择排序（O(n²)）"}, {"label": "D", "value": "D", "text": "插入排序（O(n²)）"}]}]}')"

echo -e "\n"

# 测试4: 测试错误情况 - 缺少必需参数
echo "❌ 测试4: 测试错误情况 - 缺少必需参数"
echo "----------------------------------"
curl -X POST "${API_BASE_URL}/api/upload-questions-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "question_text": "这是一个测试题目",
        "question_type": "code"
      }
    ]
  }' \
  -w "\n状态码: %{http_code}\n响应时间: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "响应内容: $(curl -s -X POST "${API_BASE_URL}/api/upload-questions-batch" -H "Content-Type: application/json" -d '{"questions": [{"question_text": "这是一个测试题目", "question_type": "code"}]}')"

echo -e "\n"

# 测试5: 测试错误情况 - 缺少question_text
echo "❌ 测试5: 测试错误情况 - 缺少question_text"
echo "----------------------------------"
curl -X POST "${API_BASE_URL}/api/upload-questions-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "question_type": "code",
        "correct_answer": "A"
      }
    ]
  }' \
  -w "\n状态码: %{http_code}\n响应时间: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "响应内容: $(curl -s -X POST "${API_BASE_URL}/api/upload-questions-batch" -H "Content-Type: application/json" -d '{"questions": [{"question_type": "code", "correct_answer": "A"}]}')"

echo -e "\n"

# 测试6: 测试混合类型的批量上传（代码题+文本题）
echo "📝 测试6: 测试混合类型的批量上传（代码题+文本题）"
echo "----------------------------------"
curl -X POST "${API_BASE_URL}/api/upload-questions-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "question_text": "以下哪个函数能正确计算两个整数的和？",
        "question_type": "code",
        "question_code": "def add_numbers(a, b):\n    # 在这里编写代码\n    pass",
        "correct_answer": "A",
        "explanation": "选项A是正确的加法函数实现",
        "level": 1,
        "difficulty": "easy",
        "options": [
          {
            "label": "A",
            "value": "A",
            "text": "def add_numbers(a, b):\n    return a + b"
          },
          {
            "label": "B",
            "value": "B",
            "text": "def add_numbers(a, b):\n    return a - b"
          }
        ]
      },
      {
        "question_text": "什么是变量？",
        "question_type": "text",
        "correct_answer": "A",
        "explanation": "变量是存储数据的容器，可以存储不同类型的数据",
        "level": 1,
        "difficulty": "easy",
        "options": [
          {
            "label": "A",
            "value": "A",
            "text": "存储数据的容器"
          },
          {
            "label": "B",
            "value": "B",
            "text": "程序文件"
          }
        ]
      }
    ]
  }' \
  -w "\n状态码: %{http_code}\n响应时间: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "响应内容: $(curl -s -X POST "${API_BASE_URL}/api/upload-questions-batch" -H "Content-Type: application/json" -d '{"questions": [{"question_text": "以下哪个函数能正确计算两个整数的和？", "question_type": "code", "question_code": "def add_numbers(a, b):\n    # 在这里编写代码\n    pass", "correct_answer": "A", "explanation": "选项A是正确的加法函数实现", "level": 1, "difficulty": "easy", "options": [{"label": "A", "value": "A", "text": "def add_numbers(a, b):\n    return a + b"}, {"label": "B", "value": "B", "text": "def add_numbers(a, b):\n    return a - b"}]}, {"question_text": "什么是变量？", "question_type": "text", "correct_answer": "A", "explanation": "变量是存储数据的容器，可以存储不同类型的数据", "level": 1, "difficulty": "easy", "options": [{"label": "A", "value": "A", "text": "存储数据的容器"}, {"label": "B", "value": "B", "text": "程序文件"}]}]}')"

echo -e "\n"

# 测试7: 验证上传的题目
echo " 测试7: 验证上传的题目"
echo "----------------------------------"
curl -X GET "${API_BASE_URL}/api/questions" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n响应时间: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "响应内容: $(curl -s -X GET "${API_BASE_URL}/api/questions")"

echo -e "\n"

# 测试8: 查看考试ID=1的题目
echo " 测试8: 查看考试ID=1的题目"
echo "----------------------------------"
curl -X GET "${API_BASE_URL}/api/exam/1" \
  -H "Content-Type: application/json" \
  -w "\n状态码: %{http_code}\n响应时间: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "响应内容: $(curl -s -X GET "${API_BASE_URL}/api/exam/1")"

echo -e "\n"
echo "✨ 批量上传代码题测试完成!" 