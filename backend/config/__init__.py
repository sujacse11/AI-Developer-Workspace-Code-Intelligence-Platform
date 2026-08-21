# Config package
from copy import copy

def _patch_django_python314_context():
    try:
        from django.template import context
        test_c = context.Context()
        copy(test_c)
    except AttributeError:
        def base_context_copy(self):
            cls = self.__class__
            duplicate = cls.__new__(cls)
            duplicate.dicts = self.dicts[:]
            return duplicate

        def context_copy(self):
            duplicate = base_context_copy(self)
            duplicate.autoescape = getattr(self, 'autoescape', True)
            duplicate.use_l10n = getattr(self, 'use_l10n', None)
            duplicate.use_tz = getattr(self, 'use_tz', None)
            duplicate.template_name = getattr(self, 'template_name', 'unknown')
            duplicate.render_context = copy(getattr(self, 'render_context', context.RenderContext()))
            duplicate.template = getattr(self, 'template', None)
            return duplicate

        def request_context_copy(self):
            duplicate = context_copy(self)
            duplicate.request = getattr(self, 'request', None)
            duplicate._processors = getattr(self, '_processors', None)
            duplicate._processors_index = getattr(self, '_processors_index', None)
            return duplicate

        context.BaseContext.__copy__ = base_context_copy
        context.Context.__copy__ = context_copy
        context.RequestContext.__copy__ = request_context_copy

_patch_django_python314_context()

