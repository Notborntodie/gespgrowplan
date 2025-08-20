import os
from openai import OpenAI

def test_dashscope_api():
    """
    测试DashScope API连接
    """
    try:
        # 获取API密钥
        api_key = os.getenv("DASHSCOPE_API_KEY")
        if not api_key:
            print("❌ 错误: 未找到DASHSCOPE_API_KEY环境变量")
            return False
        
        print(f"✅ API密钥已设置: {api_key[:10]}...")
        
        # 创建客户端
        client = OpenAI(
            api_key=api_key,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )
        
        print("✅ 客户端创建成功")
        
        # 测试API调用
        print("🔄 正在测试API调用...")
        
        completion = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {'role': 'system', 'content': 'You are a helpful assistant.'},
                {'role': 'user', 'content': '你是谁？'}
            ],
            temperature=0.3,
            max_tokens=100
        )
        
        print("✅ API调用成功!")
        print(f"📝 响应内容: {completion.choices[0].message.content}")
        print(f"🔧 模型信息: {completion.model}")
        print(f"📊 使用情况: {completion.usage}")
        
        return True
        
    except Exception as e:
        print(f"❌ API测试失败: {str(e)}")
        return False

def test_llm_processor():
    """
    测试LLM处理器
    """
    try:
        from llm_processor import LLMProcessor
        
        print("\n🔄 测试LLM处理器...")
        
        # 创建处理器
        processor = LLMProcessor(use_dashscope=True)
        print("✅ LLM处理器创建成功")
        
        # 测试简单prompt
        test_prompt = "请将以下内容转换为JSON格式：[1, 2, 3]"
        
        print("🔄 测试简单prompt...")
        response = processor.call_api(test_prompt)
        print(f"✅ 响应成功: {response[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ LLM处理器测试失败: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 开始测试DashScope API...")
    print("=" * 50)
    
    # 测试基础API
    api_success = test_dashscope_api()
    
    print("\n" + "=" * 50)
    
    # 测试LLM处理器
    processor_success = test_llm_processor()
    
    print("\n" + "=" * 50)
    
    if api_success and processor_success:
        print("🎉 所有测试通过！LLM功能可以正常使用。")
    else:
        print("⚠️ 部分测试失败，请检查配置。") 