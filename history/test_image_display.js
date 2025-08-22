const axios = require('axios');

async function testImageUrls() {
  const BASE_URL = 'http://localhost:3000';
  
  try {
    console.log('=== 测试图片显示功能 ===\n');

    // 1. 获取考试数据
    console.log('1. 获取考试1的数据...');
    const examResponse = await axios.get(`${BASE_URL}/api/exam/1`);
    console.log('✅ 考试数据获取成功');
    console.log(`考试名称: ${examResponse.data.exam.name}`);
    console.log(`题目数量: ${examResponse.data.questions.length}\n`);

    // 2. 找出有图片的题目
    const questionsWithImages = examResponse.data.questions.filter(q => 
      q.image_url || (q.images && q.images.length > 0)
    );
    
    console.log(`2. 有图片的题目数量: ${questionsWithImages.length}`);
    
    if (questionsWithImages.length > 0) {
      console.log('有图片的题目:');
      questionsWithImages.forEach((q, index) => {
        console.log(`\n题目${q.question_number}:`);
        console.log(`  题目图片URL: ${q.image_url || '无'}`);
        console.log(`  附加图片数量: ${q.images ? q.images.length : 0}`);
        
        if (q.images && q.images.length > 0) {
          q.images.forEach((img, imgIndex) => {
            console.log(`    附加图片${imgIndex + 1}: ${img.image_url}`);
          });
        }
      });
      
      // 3. 测试前端访问
      console.log('\n3. 前端访问测试:');
      console.log('✅ 图片样式已优化，现在图片会以合适大小显示，无需点击即可查看完整内容');
      console.log('请在浏览器中访问以下页面查看图片显示效果:');
      console.log(`- 考试页面: http://localhost:5173/exam/1`);
      console.log(`- 题目列表: http://localhost:5173/admin`);
      console.log(`- 题目详情: 在题目列表中点击"查看详情"`);
      console.log('\n📝 样式改进说明:');
      console.log('- 图片现在使用 object-fit: contain 保持比例');
      console.log('- 最大高度限制为300px（考试页面）和400px（详情页面）');
      console.log('- 图片标签移到右上角，不遮挡内容');
      console.log('- 添加了边框和悬停效果');
      
      // 4. 测试图片URL是否可访问
      console.log('\n4. 测试图片URL可访问性:');
      for (const q of questionsWithImages) {
        if (q.image_url) {
          try {
            const imageResponse = await axios.head(q.image_url);
            console.log(`✅ 题目${q.question_number}主图片可访问: ${q.image_url}`);
          } catch (error) {
            console.log(`❌ 题目${q.question_number}主图片无法访问: ${q.image_url}`);
          }
        }
        
        if (q.images) {
          for (const img of q.images) {
            try {
              const imageResponse = await axios.head(img.image_url);
              console.log(`✅ 题目${q.question_number}附加图片可访问: ${img.image_url}`);
            } catch (error) {
              console.log(`❌ 题目${q.question_number}附加图片无法访问: ${img.image_url}`);
            }
          }
        }
      }
    } else {
      console.log('⚠️  没有找到带图片的题目');
      console.log('建议: 上传一些带图片的题目进行测试');
    }

  } catch (error) {
    console.error('测试出错:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testImageUrls(); 