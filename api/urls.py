from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, InstrumentoViewSet, UsuarioViewSet, PrestamoViewSet

router = DefaultRouter()

router.register(r'categorias', CategoriaViewSet)
router.register(r'instrumentos', InstrumentoViewSet)
router.register(r'usuarios', UsuarioViewSet)
router.register(r'prestamos', PrestamoViewSet)

urlpatterns = router.urls