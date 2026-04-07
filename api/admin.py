from django.contrib import admin
from django.utils.html import format_html
from .models import Categoria, Instrumento, HistorialEstadoInstrumento, Usuario, Prestamo, Perfil


# =========================
# CATEGORIA
# =========================
@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion', 'total_instrumentos']
    search_fields = ['nombre']
    list_per_page = 20

    def total_instrumentos(self, obj):
        count = obj.instrumento_set.count()
        return format_html('<strong>{}</strong>', count)
    total_instrumentos.short_description = 'Total Instrumentos'


# =========================
# INSTRUMENTO
# =========================
@admin.register(Instrumento)
class InstrumentoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'referencia', 'categoria', 'estado_colored', 'fecha_adquisicion', 'cantidad']
    list_filter = ['estado', 'categoria', 'fecha_adquisicion']
    search_fields = ['nombre', 'referencia', 'marca']
    readonly_fields = ['estado']

    fieldsets = (
        ('Información General', {'fields': ('nombre', 'referencia', 'marca', 'modelo')}),
        ('Categoría', {'fields': ('categoria',)}),
        ('Inventario', {'fields': ('cantidad',)}),
        ('Fechas', {'fields': ('fecha_adquisicion',)}),
        ('Estado', {'fields': ('estado',)}),
    )

    list_per_page = 20

    def estado_colored(self, obj):
        colors = {
            'disponible': '#28a745',
            'prestado': '#ffc107',
            'mantenimiento': '#fd7e14',
            'baja': '#dc3545'
        }
        color = colors.get(obj.estado, '#6c757d')

        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_colored.short_description = 'Estado'


# =========================
# HISTORIAL MOVIMIENTOS
# =========================
@admin.register(HistorialEstadoInstrumento)
class HistorialEstadoInstrumentoAdmin(admin.ModelAdmin):

    list_display = [
        'instrumento',
        'tipo_movimiento',
        'estado_anterior',
        'estado_nuevo',
        'fecha_cambio',
        'cambiado_por'
    ]

    list_filter = [
        'tipo_movimiento',
        'estado_nuevo',
        'fecha_cambio'
    ]

    search_fields = [
        'instrumento__nombre',
        'observacion'
    ]

    readonly_fields = [
        'instrumento',
        'tipo_movimiento',
        'estado_anterior',
        'estado_nuevo',
        'fecha_cambio',
        'cambiado_por',
        'observacion'
    ]

    list_per_page = 20
    date_hierarchy = 'fecha_cambio'


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

    list_display = [
        'instrumento',
        'usuario',
        'fecha_prestamo',
        'estado_color'
    ]

    list_filter = ['estado', 'fecha_prestamo']

    search_fields = [
        'instrumento__nombre',
        'usuario__nombre',
        'usuario__documento'
    ]

    readonly_fields = ['fecha_prestamo']

    fieldsets = (
        ('Participantes', {'fields': ('instrumento', 'usuario')}),
        ('Fechas de Préstamo', {'fields': ('fecha_prestamo', 'fecha_devolucion')}),
        ('Configuración', {'fields': ('estado',)}),
        ('Notas', {'fields': ('observaciones',)}),
    )

    list_per_page = 20
    date_hierarchy = 'fecha_prestamo'

    def estado_color(self, obj):
        colors = {
            'disponible': '#28a745',
            'enuso': '#ffc107',
            'reparacion': '#fd7e14'
        }
        color = colors.get(obj.estado, '#6c757d')

        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_color.short_description = 'Estado'


# =========================
# PERFIL (ROL)
# =========================
@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):

    list_display = ['user', 'rol_color']
    list_filter = ['rol']
    search_fields = ['user__username', 'user__email']

    fieldsets = (
        ('Usuario', {'fields': ('user',)}),
        ('Rol', {'fields': ('rol',)}),
    )

    list_per_page = 20

    def rol_color(self, obj):
        colors = {
            'administrador': '#dc3545',
            'almacenista': '#ffc107',
            'profesor': '#0d6efd',
            'estudiante': '#6c757d'
        }
        color = colors.get(obj.rol, '#6c757d')

        return format_html(
            '<span style="padding: 5px 10px; background-color: {}; color: white; border-radius: 3px;">{}</span>',
            color,
            obj.get_rol_display()
        )
    rol_color.short_description = 'Rol'