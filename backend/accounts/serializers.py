from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, UserAddress


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(
        write_only=True, required=True, min_length=8,
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )

    class Meta:
        model = CustomUser
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password2']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        email = attrs.get('email', '').lower()
        password = attrs.get('password', '')
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Your account has been deactivated.')
        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """Full user profile serializer."""
    full_name = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'profile_image', 'profile_image_url',
            'date_of_birth', 'is_verified', 'date_joined', 'is_staff',
        ]
        read_only_fields = ['id', 'email', 'is_verified', 'date_joined', 'is_staff']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_profile_image_url(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'phone', 'profile_image', 'date_of_birth']

    def validate_phone(self, value):
        if value and not value.replace('+', '').replace('-', '').isdigit():
            raise serializers.ValidationError('Enter a valid phone number.')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True, required=True, min_length=8, style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'New passwords do not match.'}
            )
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password - sends OTP."""
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = CustomUser.objects.get(email=value.lower())
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('No user found with this email address.')
        self.user = user
        return value.lower()


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting password with OTP."""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(
        write_only=True, min_length=8, style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, style={'input_type': 'password'}
    )

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {'confirm_password': 'Passwords do not match.'}
            )
        try:
            user = CustomUser.objects.get(email=attrs['email'].lower())
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({'email': 'User not found.'})
        if not user.is_otp_valid(attrs['otp']):
            raise serializers.ValidationError({'otp': 'Invalid or expired OTP.'})
        attrs['user'] = user
        return attrs


class UserAddressSerializer(serializers.ModelSerializer):
    """Serializer for user addresses."""
    class Meta:
        model = UserAddress
        fields = [
            'id', 'name', 'phone', 'address_line1', 'address_line2',
            'city', 'state', 'pincode', 'country', 'is_default',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_pincode(self, value):
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError('Enter a valid 6-digit PIN code.')
        return value

    def validate_phone(self, value):
        cleaned = value.replace('+', '').replace('-', '').replace(' ', '')
        if not cleaned.isdigit() or len(cleaned) < 10:
            raise serializers.ValidationError('Enter a valid phone number.')
        return value
