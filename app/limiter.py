"""Single shared rate limiter instance.

All routers must import this instead of creating their own Limiter,
otherwise limits are tracked per-instance (per-process memory) and the
`app.state.limiter` attachment in main.py won't apply to them.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
