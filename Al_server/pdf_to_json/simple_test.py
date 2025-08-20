import os
from openai import OpenAI

print("🚀 开始简单测试...")

try:
    # 获取API密钥
    api_key = os.getenv("DASHSCOPE_API_KEY")
    print(f"✅ API密钥: {api_key[:10]}...")
    
    # 创建客户端
    client = OpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    print("✅ 客户端创建成功")
    
    # 测试API调用
    completion = client.chat.completions.create(
        model="qwen-plus",
        messages=[
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': '你是谁？'}
        ],
    )
    
    print("✅ API调用成功!")
    print(f"📝 响应: {completion.choices[0].message.content}")
    print(f"🔧 模型: {completion.model}")
    
except Exception as e:
    print(f"❌ 错误: {str(e)}")
    print(f"🔍 错误类型: {type(e)}") 