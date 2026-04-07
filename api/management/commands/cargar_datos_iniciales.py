"""
Comando para cargar datos iniciales de prueba en la base de datos.
Uso: python manage.py cargar_datos_iniciales
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.management import call_command
from api.models import Perfil


class Command(BaseCommand):
    help = 'Carga datos iniciales (fixtures) en la base de datos'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando carga de datos...'))

        try:
            # Cargar fixtures
            self.stdout.write(self.style.SUCCESS('Cargando categorías...'))
            call_command('loaddata', 'categorias.json')

            self.stdout.write(self.style.SUCCESS('Cargando instrumentos...'))
            call_command('loaddata', 'instrumentos.json')

            self.stdout.write(self.style.SUCCESS('Cargando usuarios...'))
            call_command('loaddata', 'usuarios.json')

            # Crear usuario administrador si no existe
            if not User.objects.filter(username='admin').exists():
                self.stdout.write(self.style.SUCCESS('Creando usuario administrador...'))
                admin_user = User.objects.create_superuser(
                    username='admin',
                    email='admin@conservatorio.edu',
                    password='admin123'
                )
                # Crear perfil de administrador
                Perfil.objects.create(user=admin_user, rol='administrador')
                self.stdout.write(self.style.SUCCESS('✓ Usuario admin creado (usuario: admin, contraseña: admin123)'))

            # Crear usuario almacenista si no existe
            if not User.objects.filter(username='almacenista').exists():
                self.stdout.write(self.style.SUCCESS('Creando usuario almacenista...'))
                almacen_user = User.objects.create_user(
                    username='almacenista',
                    email='almacenista@conservatorio.edu',
                    password='almacen123'
                )
                # Crear perfil de almacenista
                Perfil.objects.create(user=almacen_user, rol='almacenista')
                self.stdout.write(self.style.SUCCESS('✓ Usuario almacenista creado'))

            # Crear usuario profesor si no existe
            if not User.objects.filter(username='profesor').exists():
                self.stdout.write(self.style.SUCCESS('Creando usuario profesor...'))
                profesor_user = User.objects.create_user(
                    username='profesor',
                    email='profesor@conservatorio.edu',
                    password='profesor123'
                )
                # Crear perfil de profesor
                Perfil.objects.create(user=profesor_user, rol='profesor')
                self.stdout.write(self.style.SUCCESS('✓ Usuario profesor creado'))

            self.stdout.write(self.style.SUCCESS('✓ ¡Datos cargados correctamente!'))
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('Usuarios de prueba disponibles:'))
            self.stdout.write('  - admin / admin123 (Administrador)')
            self.stdout.write('  - almacenista / almacen123 (Almacenista)')
            self.stdout.write('  - profesor / profesor123 (Profesor)')
            self.stdout.write('')

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error al cargar datos: {str(e)}'))
