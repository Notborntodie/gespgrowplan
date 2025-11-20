import axios from 'axios';

const BASE_URL = 'http://106.14.143.27:3000/api';

console.log('🔍 分析远程API状态...\n');

async function analyzeAPI() {
  const results = {
    working: [],
    notFound: [],
    authRequired: [],
    otherErrors: []
  };

  // 测试所有可能的API端点
  const endpoints = [
    { path: '/exams', name: '考试列表' },
    { path: '/questions', name: '题目列表' },
    { path: '/knowledge-points', name: '知识点列表' },
    { path: '/submissions', name: '提交记录' },
    { path: '/available-questions', name: '可用题目' },
    { path: '/login', name: '登录' },
    { path: '/register', name: '注册' },
    { path: '/upload-image', name: '图片上传' },
    { path: '/health', name: '健康检查' },
    { path: '/exam', name: '考试详情' },
    { path: '/submit-exam', name: '提交考试' },
    { path: '/questions/batch', name: '批量题目' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        timeout: 5000
      });
      
      results.working.push({
        path: endpoint.path,
        name: endpoint.name,
        status: response.status,
        dataType: Array.isArray(response.data) ? 'array' : 'object',
        dataLength: Array.isArray(response.data) ? response.data.length : Object.keys(response.data).length
      });
      
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        
        if (status === 404) {
          results.notFound.push({
            path: endpoint.path,
            name: endpoint.name,
            status: status
          });
        } else if (status === 401 || status === 403) {
          results.authRequired.push({
            path: endpoint.path,
            name: endpoint.name,
            status: status
          });
        } else {
          results.otherErrors.push({
            path: endpoint.path,
            name: endpoint.name,
            status: status,
            message: error.response.data?.message || error.message
          });
        }
      } else {
        results.otherErrors.push({
          path: endpoint.path,
          name: endpoint.name,
          status: 'NETWORK_ERROR',
          message: error.message
        });
      }
    }
  }

  // 输出分析结果
  console.log('📊 API状态分析结果:\n');

  if (results.working.length > 0) {
    console.log('✅ 正常工作的API:');
    results.working.forEach(api => {
      console.log(`   ${api.path} (${api.name}) - 状态码: ${api.status}`);
      console.log(`       数据类型: ${api.dataType}, 长度: ${api.dataLength}`);
    });
    console.log('');
  }

  if (results.notFound.length > 0) {
    console.log('❌ 不存在的API端点:');
    results.notFound.forEach(api => {
      console.log(`   ${api.path} (${api.name}) - 状态码: ${api.status}`);
    });
    console.log('');
  }

  if (results.authRequired.length > 0) {
    console.log('🔐 需要认证的API:');
    results.authRequired.forEach(api => {
      console.log(`   ${api.path} (${api.name}) - 状态码: ${api.status}`);
    });
    console.log('');
  }

  if (results.otherErrors.length > 0) {
    console.log('⚠️ 其他错误的API:');
    results.otherErrors.forEach(api => {
      console.log(`   ${api.path} (${api.name}) - 状态码: ${api.status}`);
      console.log(`       错误信息: ${api.message}`);
    });
    console.log('');
  }

  // 统计信息
  const total = endpoints.length;
  const working = results.working.length;
  const notFound = results.notFound.length;
  const authRequired = results.authRequired.length;
  const otherErrors = results.otherErrors.length;

  console.log('📈 统计信息:');
  console.log(`总API数: ${total}`);
  console.log(`正常工作: ${working} (${((working/total)*100).toFixed(1)}%)`);
  console.log(`不存在: ${notFound} (${((notFound/total)*100).toFixed(1)}%)`);
  console.log(`需要认证: ${authRequired} (${((authRequired/total)*100).toFixed(1)}%)`);
  console.log(`其他错误: ${otherErrors} (${((otherErrors/total)*100).toFixed(1)}%)`);

  // 建议
  console.log('\n💡 建议:');
  if (working >= total * 0.7) {
    console.log('✅ 大部分API工作正常，前端应该可以正常使用');
  } else if (working >= total * 0.5) {
    console.log('⚠️ 部分API工作正常，建议检查不存在的API端点');
  } else {
    console.log('❌ 大部分API存在问题，建议检查服务器配置');
  }

  if (notFound > 0) {
    console.log(`📝 需要检查 ${notFound} 个不存在的API端点，可能需要更新路由配置`);
  }

  if (authRequired > 0) {
    console.log(`🔐 有 ${authRequired} 个API需要认证，这是正常的`);
  }
}

analyzeAPI().catch(console.error);
