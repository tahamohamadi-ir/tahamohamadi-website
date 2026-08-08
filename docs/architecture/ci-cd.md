# Production CI/CD

The Production deployment model is pull-based.

GitHub Actions validates the application, publishes immutable Backend and Frontend images to GHCR, and waits for manual approval through the `production` environment. After approval, GitHub creates a unique immutable `production-<run-number>-<attempt>-<sha>` tag.

The VPS polls approved tags through a systemd timer. For each new approved SHA, it creates a Production backup, pulls exact images, deploys Backend and Frontend without recreating PostgreSQL, validates Origin and public endpoints, and rolls back to the previous commit and image pair after failure.

## Security properties

- GitHub does not connect to the VPS through SSH.
- Port 22 remains restricted to the operator IP.
- Application and infrastructure secrets remain outside GitHub.
- PostgreSQL and Media volumes are never deleted or recreated.
- Each deployment uses an immutable Git commit SHA.
- Backup runs before every Production deployment.
- Failed deployments restore the previous repository commit and image pair.

## Production files

- Compose: `/opt/taha/repository/compose.production.yaml`
- Secrets: `/opt/taha/secrets/.env.production`
- Current state: `/opt/taha/deploy/current.env`
- Previous state: `/opt/taha/deploy/previous.env`
- History: `/opt/taha/deploy/history.log`
- Deploy script: `/usr/local/sbin/taha-deploy`
- Watcher: `/usr/local/sbin/taha-deploy-watch`
- Timer: `taha-deploy-watch.timer`
- Version endpoint: `https://tahamohamadi.ir/deployment-version`

## Operational commands

```bash
sudo systemctl list-timers taha-deploy-watch.timer --all --no-pager
sudo systemctl status taha-deploy-watch.service --no-pager
sudo journalctl -u taha-deploy-watch.service --no-pager -n 300
sudo cat /opt/taha/deploy/current.env
sudo cat /opt/taha/deploy/history.log
curl -fsS https://tahamohamadi.ir/deployment-version
```

Never run deployment with `docker compose down -v`, `docker volume prune`, or `docker system prune --volumes`.
