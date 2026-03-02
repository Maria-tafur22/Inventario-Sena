from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
import openpyxl

from rest_framework.permissions import IsAuthenticated, BasePermission

from .models import Categoria, Instrumento, Usuario, Prestamo
from .serializers import (
    CategoriaSerializer,
    InstrumentoSerializer,
    UsuarioSerializer,
    PrestamoSerializer
)


# =========================
# PERMISOS PERSONALIZADOS
# =========================

class EsAdministrador(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'administrador'


class EsAlmacenistaOAdministrador(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'perfil') and request.user.perfil.rol in ['administrador', 'almacenista']


# =========================
# CATEGORIA
# =========================

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated, EsAdministrador]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre']
    ordering = ['nombre']


# =========================
# INSTRUMENTO
# =========================

class InstrumentoViewSet(viewsets.ModelViewSet):
    queryset = Instrumento.objects.all()
    serializer_class = InstrumentoSerializer
    permission_classes = [IsAuthenticated, EsAlmacenistaOAdministrador]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'referencia', 'marca', 'modelo', 'categoria__nombre']
    ordering_fields = ['nombre', 'fecha_adquisicion', 'estado']
    ordering = ['-fecha_adquisicion']

    # Solo administrador puede eliminar físicamente
    def destroy(self, request, *args, **kwargs):
        if request.user.perfil.rol != 'administrador':
            return Response(
                {"error": "Solo el administrador puede eliminar instrumentos."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    # Dar de baja (con historial)
    @action(detail=True, methods=['post'])
    def dar_baja(self, request, pk=None):
        instrumento = self.get_object()

        if instrumento.estado == 'prestado':
            return Response(
                {"error": "No se puede dar de baja un instrumento prestado."},
                status=status.HTTP_400_BAD_REQUEST
            )

        instrumento.cambiar_estado(
            'baja',
            usuario=request.user,
            observacion="Instrumento dado de baja manualmente"
        )

        return Response({"mensaje": "Instrumento dado de baja correctamente."})


# =========================
# USUARIO (Persona a quien se presta)
# =========================

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, EsAlmacenistaOAdministrador]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'documento', 'correo', 'tipo']
    ordering_fields = ['nombre', 'tipo']
    ordering = ['nombre']


# =========================
# PRESTAMO
# =========================

class PrestamoViewSet(viewsets.ModelViewSet):
    queryset = Prestamo.objects.all()
    serializer_class = PrestamoSerializer
    permission_classes = [IsAuthenticated, EsAlmacenistaOAdministrador]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['instrumento__nombre', 'usuario__nombre', 'usuario__documento', 'estado']
    ordering_fields = ['fecha_prestamo', 'estado']
    ordering = ['-fecha_prestamo']

    # Devolver préstamo
    @action(detail=True, methods=['post'])
    def devolver(self, request, pk=None):
        prestamo = self.get_object()

        if prestamo.estado == 'devuelto':
            return Response(
                {"error": "Este préstamo ya fue devuelto."},
                status=status.HTTP_400_BAD_REQUEST
            )

        prestamo.estado = 'devuelto'
        prestamo._usuario_sistema = request.user
        prestamo.save()

        return Response({
            "mensaje": "Préstamo marcado como devuelto correctamente.",
            "prestamo": PrestamoSerializer(prestamo).data
        })

    # Ver préstamos vencidos
    @action(detail=False, methods=['get'])
    def vencidos(self, request):
        prestamos = Prestamo.prestamos_vencidos()
        serializer = self.get_serializer(prestamos, many=True)
        return Response(serializer.data)

    # Exportar a Excel
    @action(detail=False, methods=['get'])
    def exportar_excel(self, request):
        prestamos = Prestamo.objects.all()

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Prestamos"

        ws.append(["Instrumento", "Usuario", "Fecha Préstamo", "Fecha Devolución", "Estado"])

        for p in prestamos:
            ws.append([
                p.instrumento.nombre,
                p.usuario.nombre,
                str(p.fecha_prestamo),
                str(p.fecha_devolucion) if p.fecha_devolucion else "",
                p.estado
            ])

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response['Content-Disposition'] = 'attachment; filename=prestamos.xlsx'

        wb.save(response)
        return response