from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    CategoriaViewSet, 
    InstrumentoViewSet, 
    UsuarioViewSet, 
    PrestamoViewSet,
    ReportesViewSet,
    obtener_csrf_token,
    login_personalizado,
    obtener_usuario_actual,
    logout_personalizado
)

router = DefaultRouter()

router.register(r'categorias', CategoriaViewSet)
router.register(r'instrumentos', InstrumentoViewSet)
router.register(r'usuarios', UsuarioViewSet)
router.register(r'prestamos', PrestamoViewSet)
router.register(r'reportes', ReportesViewSet, basename='reportes')

urlpatterns = [
    path('csrf-token/', obtener_csrf_token, name='csrf-token'),
    path('login/', login_personalizado, name='login'),
    path('usuario-actual/', obtener_usuario_actual, name='usuario-actual'),
    path('logout/', logout_personalizado, name='logout'),
] + router.urls