import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    """Filter set for product listings."""
    category = django_filters.CharFilter(field_name='category__slug', lookup_expr='exact')
    category_id = django_filters.NumberFilter(field_name='category__id')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_discount_price = django_filters.NumberFilter(
        field_name='discount_price', lookup_expr='gte'
    )
    max_discount_price = django_filters.NumberFilter(
        field_name='discount_price', lookup_expr='lte'
    )
    color = django_filters.CharFilter(field_name='color', lookup_expr='iexact')
    occasion = django_filters.CharFilter(field_name='occasion', lookup_expr='iexact')
    fabric = django_filters.CharFilter(field_name='fabric', lookup_expr='icontains')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    has_discount = django_filters.BooleanFilter(method='filter_has_discount')

    class Meta:
        model = Product
        fields = [
            'category', 'category_id', 'min_price', 'max_price',
            'color', 'occasion', 'fabric', 'in_stock',
            'is_featured', 'has_discount',
        ]

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset.filter(stock=0)

    def filter_has_discount(self, queryset, name, value):
        if value:
            return queryset.filter(discount_price__isnull=False)
        return queryset.filter(discount_price__isnull=True)
