# SSL/TLS 连接问题排查报告

## 问题描述
外部访问 `https://zhengyanchen.cn` 时出现错误：
```
Connection reset by peer
curl: (35) Recv failure: Connection reset by peer
```

## 诊断结果

### ✅ 正常的部分
1. **Nginx 服务状态**: 正常运行
2. **443 端口监听**: 正常监听在 `0.0.0.0:443`
3. **SSL 证书**: 存在且有效（Let's Encrypt，有效期至 2026-04-04）
4. **Nginx 配置**: 语法正确，SSL 配置正常
5. **服务器本地连接**: 可以正常访问 HTTPS（返回 200）
6. **服务器内部通过外部 IP 访问**: TLS 握手正常
7. **防火墙规则**: firewalld 已开放 443 端口

### ❌ 问题所在
**外部网络无法连接到服务器的 443 端口**

## 根本原因分析

根据诊断结果：
- 服务器端所有配置都正常
- 服务器本地和内部网络可以正常连接
- 外部网络在 TLS 握手阶段就被重置连接

**最可能的原因：云服务器安全组未开放 443 端口**

## 解决方案

### 方案 1: 检查并配置云服务器安全组（最重要）

#### 阿里云 ECS
1. 登录阿里云控制台
2. 进入 **ECS 实例** → 选择你的服务器
3. 点击 **安全组** → **配置规则**
4. 检查 **入方向规则**，确保有以下规则：
   ```
   协议类型: 自定义 TCP
   端口范围: 443/443
   授权对象: 0.0.0.0/0
   描述: HTTPS
   ```
5. 如果没有，点击 **添加安全组规则** 添加上面的规则

#### 腾讯云 CVM
1. 登录腾讯云控制台
2. 进入 **云服务器 CVM** → 选择你的服务器
3. 点击 **安全组** → **修改规则**
4. 检查 **入站规则**，确保开放 443 端口
5. 如果没有，添加规则：
   ```
   类型: 自定义
   来源: 0.0.0.0/0
   协议端口: TCP:443
   策略: 允许
   ```

#### 其他云服务商
- AWS: 检查 Security Groups，确保开放 443 端口
- 华为云: 检查安全组规则
- 其他: 查找"安全组"或"防火墙"设置，开放 443 端口

### 方案 2: 检查是否有其他网络设备拦截

如果使用了：
- **负载均衡器**: 检查负载均衡器的监听器配置
- **CDN**: 检查 CDN 的 HTTPS 配置
- **WAF**: 检查 Web 应用防火墙规则

### 方案 3: 测试网络连通性

在本地执行以下命令测试：

```bash
# 测试 TCP 连接（不进行 TLS 握手）
telnet zhengyanchen.cn 443

# 或者使用 nc (netcat)
nc -zv zhengyanchen.cn 443

# 使用 curl 测试（详细输出）
curl -v https://zhengyanchen.cn/

# 使用 openssl 测试 SSL
openssl s_client -connect zhengyanchen.cn:443 -servername zhengyanchen.cn
```

如果 `telnet` 或 `nc` 也无法连接，说明是网络层面的问题，需要检查安全组。

### 方案 4: 临时测试（使用 HTTP）

如果急需访问，可以临时禁用 HTTPS 重定向，使用 HTTP 访问：

```bash
# 在服务器上修改 Nginx 配置，临时注释掉 HTTPS 重定向
ssh root@106.14.143.27 "sed -i 's/return 301/#return 301/' /etc/nginx/conf.d/gesp-frontend.conf && nginx -t && systemctl reload nginx"
```

**注意**: 这只是临时方案，修复安全组后应该恢复 HTTPS。

## 验证步骤

配置完安全组后，执行以下命令验证：

```bash
# 1. 测试 TCP 连接
nc -zv zhengyanchen.cn 443

# 2. 测试 HTTPS 连接
curl -I https://zhengyanchen.cn/

# 3. 使用浏览器访问
# 打开浏览器访问 https://zhengyanchen.cn
```

## 其他可能的问题

如果配置安全组后仍然无法连接，检查：

1. **Nginx 错误日志**:
   ```bash
   ssh root@106.14.143.27 'tail -50 /var/log/nginx/error.log'
   ```

2. **系统防火墙** (虽然已检查，但可以再次确认):
   ```bash
   ssh root@106.14.143.27 'firewall-cmd --list-all'
   ```

3. **SELinux** (如果启用):
   ```bash
   ssh root@106.14.143.27 'getenforce'
   # 如果是 Enforcing，可能需要配置 SELinux 规则
   ```

4. **Nginx 访问日志**:
   ```bash
   ssh root@106.14.143.27 'tail -50 /var/log/nginx/access.log'
   ```

## 总结

根据诊断结果，**99% 的可能性是云服务器安全组未开放 443 端口**。请按照方案 1 检查并配置安全组规则，这应该能解决问题。

如果配置安全组后仍有问题，请提供：
1. 安全组配置截图
2. `nc -zv zhengyanchen.cn 443` 的输出
3. `curl -v https://zhengyanchen.cn/` 的完整输出


