from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth.models import User


# =========================
# CATEGORIA
# =========================
class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre


# =========================
# INSTRUMENTO
# =========================
class Instrumento(models.Model):

    ESTADOS = [
        ('disponible', 'Disponible'),
        ('prestado', 'En Préstamo'),
        ('mantenimiento', 'En Mantenimiento'),
        ('baja', 'Dado de Baja'),
    ]

    nombre = models.CharField(max_length=100)
    referencia = models.CharField(max_length=50, unique=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    fecha_adquisicion = models.DateField(blank=True, null=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default='disponible'
    )

    # Nuevos campos
    valor_reemplazo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ubicacion_fisica = models.CharField(max_length=100, blank=True, null=True)
    cantidad = models.PositiveIntegerField(default=1)
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def cambiar_estado(self, nuevo_estado, usuario=None, observacion=""):
        self.estado = nuevo_estado
        self.save()

        HistorialEstadoInstrumento.objects.create(
            instrumento=self,
            estado=nuevo_estado,
            cambiado_por=usuario,
            observacion=observacion
        )

    def __str__(self):
        return f"{self.nombre} ({self.referencia})"


# =========================
# HISTORIAL ESTADO INSTRUMENTO
# =========================
class HistorialEstadoInstrumento(models.Model):
    instrumento = models.ForeignKey(
        Instrumento,
        on_delete=models.CASCADE,
        related_name="historial_estados"
    )

    estado = models.CharField(
        max_length=20,
        choices=Instrumento.ESTADOS
    )

    fecha_cambio = models.DateTimeField(auto_now_add=True)

    cambiado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    observacion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.instrumento.nombre} - {self.estado} - {self.fecha_cambio}"


# =========================
# PERFIL (ROL DEL SISTEMA)
# =========================
class Perfil(models.Model):

    ROLES = [
        ('administrador', 'Administrador'),
        ('almacenista', 'Almacenista'),
        ('profesor', 'Profesor'),
        ('estudiante', 'Estudiante'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    rol = models.CharField(max_length=20, choices=ROLES)

    def __str__(self):
        return f"{self.user.username} - {self.rol}"


# =========================
# PERSONA (A QUIEN SE LE PRESTA)
# =========================
class Usuario(models.Model):

    TIPOS = [
        ('profesor', 'Profesor'),
        ('estudiante', 'Estudiante'),
    ]

    nombre = models.CharField(max_length=100)
    documento = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    correo = models.EmailField(blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPOS, default='estudiante')
    
    # Nuevos campos de auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"


# =========================
# PRESTAMO
# =========================
class Prestamo(models.Model):

    ESTADOS = [
        ('activo', 'Activo'),
        ('devuelto', 'Devuelto'),
    ]

    instrumento = models.ForeignKey(Instrumento, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    fecha_prestamo = models.DateField(auto_now_add=True)
    fecha_devolucion = models.DateField(blank=True, null=True)
    fecha_vencimiento = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='activo')
    
    # Nuevos campos
    observaciones = models.TextField(blank=True, null=True)
    dias_permitidos = models.PositiveIntegerField(default=7)
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.estado == 'activo' and self.instrumento.estado != 'disponible':
            raise ValidationError("El instrumento no está disponible.")

    def save(self, *args, **kwargs):
        self.full_clean()

        usuario_sistema = None
        if hasattr(self, '_usuario_sistema'):
            usuario_sistema = self._usuario_sistema

        # Calcular fecha de vencimiento
        if self.estado == 'activo' and not self.fecha_vencimiento:
            self.fecha_vencimiento = self.fecha_prestamo + timezone.timedelta(days=self.dias_permitidos)

        if self.estado == 'activo':
            self.instrumento.cambiar_estado('prestado', usuario_sistema, "Préstamo generado")

        if self.estado == 'devuelto':
            if not self.fecha_devolucion:
                self.fecha_devolucion = timezone.now().date()

            self.instrumento.cambiar_estado('disponible', usuario_sistema, "Instrumento devuelto")

        super().save(*args, **kwargs)

    @staticmethod
    def prestamos_vencidos():
        limite = timezone.now().date() - timezone.timedelta(days=7)
        return Prestamo.objects.filter(
            estado='activo',
            fecha_prestamo__lt=limite
        )

    def __str__(self):
        return f"{self.instrumento.nombre} - {self.usuario.nombre}"