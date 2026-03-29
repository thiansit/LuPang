external_url 'https://gitlab.algoxpert.tech'
nginx['listen_port'] = 8181
nginx['listen_https'] = false
nginx['ssl'] = false
nginx['proxy_set_headers'] = {
  'X-Forwarded-Proto' => 'https',
  'X-Forwarded-Ssl' => 'on'
}
nginx['client_max_body_size'] = '512m'

gitlab_rails['gitlab_shell_ssh_port'] = 2224
gitlab_rails['time_zone'] = 'Asia/Bangkok'
gitlab_rails['trusted_proxies'] = ['172.16.0.0/12', '10.0.0.0/8', '127.0.0.1']
gitlab_rails['max_attachment_size'] = 512

# ลด RAM
prometheus_monitoring['enable'] = false
alertmanager['enable'] = false
gitlab_exporter['enable'] = false
redis_exporter['enable'] = false
postgres_exporter['enable'] = false
node_exporter['enable'] = false

puma['worker_processes'] = 2
puma['min_threads'] = 1
puma['max_threads'] = 4
sidekiq['concurrency'] = 5

# Enable gitlab-sshd on port 2224
gitlab_sshd['enable'] = true
gitlab_sshd['listen_address'] = '[::]:2224'
