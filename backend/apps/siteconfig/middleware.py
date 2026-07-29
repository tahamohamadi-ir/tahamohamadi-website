"""Runtime application of approved, public redirect rules."""

from urllib.parse import urlsplit

from django.http import HttpResponsePermanentRedirect, HttpResponseRedirect

from apps.siteconfig.models import RedirectRule


PUBLIC_EXCLUDED_PREFIXES = ("/api/", "/admin/", "/media/", "/static/")
MAX_INTERNAL_REDIRECT_HOPS = 8


def safe_redirect_target(value: str) -> tuple[str, str] | None:
    """Return a target kind and normalized path only for safe destinations."""
    parsed = urlsplit(value)
    if value.startswith("/") and not value.startswith("//") and not parsed.scheme and not parsed.netloc:
        return "internal", parsed.path
    if parsed.scheme == "https" and parsed.netloc:
        return "external", ""
    return None


class RedirectRuleMiddleware:
    """Redirect GET/HEAD requests through safe, non-cyclic active rules only."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method not in {"GET", "HEAD"} or request.path.startswith(PUBLIC_EXCLUDED_PREFIXES):
            return self.get_response(request)
        rule = RedirectRule.objects.filter(source_path=request.path, is_active=True).only(
            "source_path", "target_url", "status_code"
        ).first()
        if rule is None:
            return self.get_response(request)
        target = safe_redirect_target(rule.target_url)
        if target is None or (target[0] == "internal" and self._forms_loop(rule.source_path, rule.target_url)):
            return self.get_response(request)
        if rule.status_code == 301:
            return HttpResponsePermanentRedirect(rule.target_url)
        return HttpResponseRedirect(rule.target_url)

    @staticmethod
    def _forms_loop(source_path: str, target_url: str) -> bool:
        """Follow internal targets briefly; never serve a cyclic redirect chain."""
        seen = {source_path}
        current_target = target_url
        for _ in range(MAX_INTERNAL_REDIRECT_HOPS):
            target = safe_redirect_target(current_target)
            if target is None or target[0] != "internal":
                return False
            target_path = target[1]
            if target_path in seen:
                return True
            seen.add(target_path)
            next_target = RedirectRule.objects.filter(source_path=target_path, is_active=True).values_list(
                "target_url", flat=True
            ).first()
            if next_target is None:
                return False
            current_target = next_target
        return True
