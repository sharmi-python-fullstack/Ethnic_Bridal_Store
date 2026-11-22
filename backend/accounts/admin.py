from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from .models import CustomUser, UserAddress


class UserAddressInline(admin.TabularInline):
    model = UserAddress
    extra = 0
    fields = ['name', 'phone', 'city', 'state', 'pincode', 'is_default']


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = [
        'email', 'first_name', 'last_name', 'phone',
        'is_verified', 'is_staff', 'is_active', 'date_joined'
    ]
    list_filter = ['is_verified', 'is_staff', 'is_active', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login']
    inlines = [UserAddressInline]

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'profile_image', 'date_of_birth')}),
        ('Verification', {'fields': ('is_verified', 'otp', 'otp_created_at')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'phone', 'password1', 'password2'),
        }),
    )

    def profile_thumbnail(self, obj):
        if obj.profile_image:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius:50%;" />',
                obj.profile_image.url
            )
        return 'No Image'
    profile_thumbnail.short_description = 'Avatar'


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'city', 'state', 'pincode', 'is_default', 'created_at']
    list_filter = ['state', 'country', 'is_default']
    search_fields = ['name', 'user__email', 'city', 'pincode']
    raw_id_fields = ['user']
