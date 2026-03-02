from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import Categoria, Instrumento, Usuario, Prestamo, Perfil


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

    def validate_nombre(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El nombre de la categoría no puede estar vacío.")
        return value.strip()


class InstrumentoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')

    class Meta:
        model = Instrumento
        fields = '__all__'
        read_only_fields = ['estado']

    def validate_referencia(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("La referencia no puede estar vacía.")
        return value.strip().upper()

    def validate_nombre(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El nombre del instrumento no puede estar vacío.")
        return value.strip()

    def validate(self, attrs):
        if 'categoria' not in attrs:
            raise serializers.ValidationError("La categoría es requerida.")
        return attrs


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

    def validate_nombre(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El nombre no puede estar vacío.")
        return value.strip()

    def validate_documento(self, value):
        if not value or len(value.strip()) == 0:
            raise serializers.ValidationError("El documento es requerido.")
        return value.strip()

    def validate_correo(self, value):
        if value and '@' not in value:
            raise serializers.ValidationError("Ingrese un correo válido.")
        return value

    def validate(self, attrs):
        if 'tipo' not in attrs:
            raise serializers.ValidationError("El tipo de usuario es requerido.")
        return attrs


class PrestamoSerializer(serializers.ModelSerializer):
    instrumento_nombre = serializers.ReadOnlyField(source='instrumento.nombre')
    usuario_nombre = serializers.ReadOnlyField(source='usuario.nombre')
    instrumento_estado = serializers.ReadOnlyField(source='instrumento.estado')

    class Meta:
        model = Prestamo
        fields = '__all__'
        read_only_fields = ['fecha_prestamo', 'estado']

    def validate(self, attrs):
        instrumento = attrs.get('instrumento')
        if instrumento and instrumento.estado != 'disponible':
            raise serializers.ValidationError(
                f"El instrumento no está disponible. Estado actual: {instrumento.estado}"
            )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        prestamo = Prestamo(**validated_data)
        prestamo._usuario_sistema = request.user
        prestamo.save()
        return prestamo

    def update(self, instance, validated_data):
        request = self.context.get('request')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance._usuario_sistema = request.user
        instance.save()
        return instance
        instance.save()

        return instance