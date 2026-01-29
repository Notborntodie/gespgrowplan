# Safari SSL连接测试报告

## 测试时间
2026-01-04

## 问题描述
Safari浏览器无法打开网站 https://zhengyanchen.cn，显示"服务器意外中断了连接"，但Chrome和Edge可以正常访问。

## 测试结果

### 1. 基本HTTPS连接测试
- ❌ 从本地测试：连接被重置 (Connection reset by peer)
- ✅ 服务器本地测试：连接正常

### 2. SSL证书验证
- ✅ 证书有效
- ✅ 证书链完整
- ✅ 证书验证通过

### 3. TLS版本支持
- ✅ TLS 1.2 支持
- ✅ TLS 1.3 支持

### 4. OCSP Stapling配置
- ⚠️ 证书中不包含OCSP responder URL
- ✅ 已在配置中禁用OCSP Stapling

## 已修复的问题

1. **OCSP Stapling配置问题**
   - 问题：配置启用了OCSP Stapling，但证书不包含OCSP信息
   - 解决：已禁用OCSP Stapling配置
   - 位置：`frontend/deploy-frontend.sh` 第221-227行

## 当前配置状态

- SSL协议：TLSv1.2, TLSv1.3
- 加密套件：已配置兼容Safari的套件
- OCSP Stapling：已禁用
- HTTP/2：nginx支持，但未明确配置

## 下一步操作

### 1. 重新部署配置
```bash
cd frontend
./deploy-frontend.sh
```

### 2. 测试Safari访问
在Safari中访问 https://zhengyanchen.cn，检查是否正常。

### 3. 如果问题仍然存在

#### 选项A：明确禁用HTTP/2（如果怀疑HTTP/2兼容性问题）
修改配置中的 `listen 443 ssl;` 为 `listen 443 ssl http2;` 或保持默认（HTTP/2通常不是问题）

#### 选项B：检查防火墙/安全组规则
- 检查云服务器安全组是否有限制
- 检查firewalld规则

#### 选项C：查看实时日志
```bash
# 在Safari访问时，实时查看日志
ssh root@106.14.143.27 'tail -f /var/log/nginx/error.log'
ssh root@106.14.143.27 'tail -f /var/log/nginx/access.log | grep -i safari'
```

## 测试脚本

已创建测试脚本：`frontend/test-safari-ssl.sh`

使用方法：
```bash
cd frontend
./test-safari-ssl.sh
```

## 注意事项

1. 从本地网络测试时出现连接重置，但服务器本地测试正常
2. 这可能与网络环境、防火墙或安全组规则有关
3. 如果Chrome和Edge可以访问，说明基本连接是正常的
4. Safari可能有特定的TLS握手要求


