from django.contrib import admin
from .models import Categoria, Instrumento, HistorialEstadoInstrumento, Usuario, Prestamo, Perfil


# =========================
# CATEGORIA
# =========================
@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion']
    search_fields = ['nombre']
    list_per_page = 20


# =========================
# INSTRUMENTO
# =========================
@admin.register(Instrumento)
class InstrumentoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'referencia', 'categoria', 'estado', 'fecha_adquisicion']
    list_filter = ['estado', 'categoria', 'fecha_adquisicion']
    search_fields = ['nombre', 'referencia', 'marca']
    readonly_fields = ['estado']
    fieldsets = (
        ('Información General', {'fields': ('nombre', 'referencia', 'marca', 'modelo')}),
        ('Categoría y Ubicación', {'fields': ('categoria',)}),
        ('Fechas', {'fields': ('fecha_adquisicion',)}),
        ('Estado', {'fields': ('estado',)}),
    )
    list_per_page = 20


# =========================
# HISTORIAL ESTADO INSTRUMENTO
# =========================
@admin.register(HistorialEstadoInstrumento)
class HistorialEstadoInstrumentoAdmin(admin.ModelAdmin):
    list_display = ['instrumento', 'estado', 'fecha_cambio', 'cambiado_por']
    list_filter = ['estado', 'fecha_cambio']
    search_fields = ['instrumento__nombre']
    readonly_fields = ['instrumento', 'estado', 'fecha_cambio', 'cambiado_por', 'observacion']
    list_per_page = 20


# =========================
# USUARIO
# =========================
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'documento', 'tipo', 'correo']
    list_filter = ['tipo']
    search_fields = ['nombre', 'documento', 'correo']
    fieldsets = (
        ('Información Personal', {'fields': ('nombre', 'documento', 'tipo')}),
        ('Contacto', {'fields': ('correo', 'telefono')}),
    )
    list_per_page = 20


# =========================
# PRESTAMO
# =========================
@admin.register(Prestamo)
class PrestamoAdmin(admin.ModelAdmin):
    list_display = ['instrumento', 'usuario', 'fecha_prestamo', 'fecha_devolucion', 'estado']
    list_filter = ['estado', 'fecha_prestamo']
    search_fields = ['instrumento__nombre', 'usuario__nombre']
    readonly_fields = ['fecha_prestamo']
    fieldsets = (
        ('Información', {'fields': ('instrumento', 'usuario')}),
        ('Fechas', {'fields': ('fecha_prestamo', 'fecha_devolucion')}),
        ('Estado', {'fields': ('estado',)}),
    )
    list_per_page = 20


# =========================
# PERFIL (ROL)
# =========================
@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ['user', 'rol']
    list_filter = ['rol']
    search_fields = ['user__username']
    fieldsets = (
        ('Usuario', {'fields': ('user',)}),
        ('Rol', {'fields': ('rol',)}),
    )
    list_per_page = 20
