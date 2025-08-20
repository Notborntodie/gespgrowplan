#!/usr/bin/env python3
"""
测试参数传递的脚本
"""

import requests
import os

def test_parameter_passing():
    """测试参数传递"""
    
    # 创建一个测试PDF文件（如果不存在）
    test_pdf_path = "test.pdf"
    if not os.path.exists(test_pdf_path):
        # 创建一个简单的PDF文件用于测试
        from reportlab.pdfgen import canvas
        c = canvas.Canvas(test_pdf_path)
        c.drawString(100, 750, "Test PDF for parameter testing")
        c.save()
    
    # 测试不同的参数组合
    test_cases = [
        {"parallel_workers": 1, "expected_questions": "10"},
        {"parallel_workers": 3, "expected_questions": "20"},
        {"parallel_workers": 5, "expected_questions": ""},
        {"parallel_workers": 8, "expected_questions": "50"},
    ]
    
    for i, test_case in enumerate(test_cases):
        print(f"\n🧪 测试用例 {i+1}: {test_case}")
        
        try:
            with open(test_pdf_path, 'rb') as f:
                files = {'file': ('test.pdf', f, 'application/pdf')}
                data = {
                    'use_llm': 'true',
                    'parallel_workers': str(test_case['parallel_workers']),
                    'expected_questions': test_case['expected_questions']
                }
                
                response = requests.post('http://localhost:8000/upload', files=files, data=data)
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ 成功 - 状态: {result.get('status')}")
                    print(f"   并行线程数: {result.get('parallel_workers')}")
                    print(f"   预期题目数: {result.get('expected_questions')}")
                else:
                    print(f"❌ 失败 - 状态码: {response.status_code}")
                    print(f"   响应: {response.text}")
                    
        except Exception as e:
            print(f"❌ 异常: {str(e)}")

if __name__ == "__main__":
    test_parameter_passing() 