#!/usr/bin/env python
"""
Script para inicializar datos de prueba en la base de datos.
Este script debe ejecutarse con: python setup_test_data.py
"""

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Inventario.settings')
sys.path.insert(0, os.path.dirname(__file__))

django.setup()

from django.contrib.auth.models import User
from api.models import Categoria, Perfil

def crear_usuarios():
    """Crea usuarios de prueba."""
    usuarios = [
        {
            'username': 'admin',
            'password': '1234',
            'email': 'admin@inventario.com',
            'rol': 'administrador'
        },
        {
            'username': 'almacenista',
            'password': 'almacen123',
            'email': 'almacenista@inventario.com',
            'rol': 'almacenista'
        },
        {
            'username': 'profesor',
            'password': 'profesor123',
            'email': 'profesor@inventario.com',
            'rol': 'profesor'
        }
    ]
    
    for user_data in usuarios:
        try:
            # Crear usuario Django
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'is_staff': user_data['rol'] == 'administrador',
                    'is_superuser': user_data['rol'] == 'administrador'
                }
            )
            
            if created:
                user.set_password(user_data['password'])
                user.save()
                print(f"✅ Usuario '{user_data['username']}' creado exitosamente")
            else:
                # Si ya existe, actualizar contraseña
                user.set_password(user_data['password'])
                user.save()
                print(f"✅ Usuario '{user_data['username']}' actualizado")
                
            # Crear Perfil si no existe
            perfil, created = Perfil.objects.get_or_create(
                user=user,
                defaults={'rol': user_data['rol']}
            )
            
            if created:
                print(f"   → Perfil '{user_data['rol']}' creado")
            else:
                perfil.rol = user_data['rol']
                perfil.save()
                print(f"   → Perfil '{user_data['rol']}' actualizado")
                
        except Exception as e:
            print(f"❌ Error al crear usuario '{user_data['username']}': {str(e)}")

def crear_categorias():
    """Crea categorías de prueba."""
    categorias = [
        {'nombre': 'Cuerdas', 'descripcion': 'Instrumentos de cuerda (guitarra, violín, etc.)'},
        {'nombre': 'Vientos', 'descripcion': 'Instrumentos de viento (flauta, trompeta, etc.)'},
        {'nombre': 'Percusión', 'descripcion': 'Instrumentos de percusión (tambor, timbal, etc.)'},
        {'nombre': 'Teclados', 'descripcion': 'Instrumentos de teclado (piano, sintetizador, etc.)'},
    ]
    
    for cat_data in categorias:
        try:
            category, created = Categoria.objects.get_or_create(
                nombre=cat_data['nombre'],
                defaults={'descripcion': cat_data['descripcion']}
            )
            
            if created:
                print(f"✅ Categoría '{cat_data['nombre']}' creada")
            else:
                print(f"   Categoría '{cat_data['nombre']}' ya existe")
                
        except Exception as e:
            print(f"❌ Error al crear categoría '{cat_data['nombre']}': {str(e)}")

if __name__ == '__main__':
    print("=" * 60)
    print("🎵  INICIALIZANDO DATOS DE PRUEBA 🎵")
    print("=" * 60)
    
    print("\n📝 Creando usuarios...")
    crear_usuarios()
    
    print("\n📂 Creando categorías...")
    crear_categorias()
    
    print("\n" + "=" * 60)
    print("✅ ¡Datos de prueba inicializados correctamente!")
    print("=" * 60)
    print("\n📋 Usuarios de prueba:")
    print("  • admin / 1234 (Administrador)")
    print("  • almacenista / almacen123 (Almacenista)")
    print("  • profesor / profesor123 (Profesor)")
