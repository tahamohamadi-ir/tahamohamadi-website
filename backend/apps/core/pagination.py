"""Shared pagination for list endpoints."""

from collections import OrderedDict

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class DefaultPageNumberPagination(PageNumberPagination):
    """Page-number pagination with a client-adjustable, capped page size.

    Response shape is flat and stable so the frontend can bind one component to
    every paginated endpoint:

        {"count": 42, "page": 2, "page_size": 20, "total_pages": 3,
         "next": "...", "previous": "...", "results": [...]}
    """

    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data) -> Response:
        return Response(
            OrderedDict(
                [
                    ("count", self.page.paginator.count),
                    ("page", self.page.number),
                    ("page_size", self.get_page_size(self.request)),
                    ("total_pages", self.page.paginator.num_pages),
                    ("next", self.get_next_link()),
                    ("previous", self.get_previous_link()),
                    ("results", data),
                ]
            )
        )
