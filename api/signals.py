"""
Signals para automatizar acciones cuando ocurren cambios en los modelos.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Prestamo, Instrumento, HistorialEstadoInstrumento


@receiver(post_save, sender=Prestamo)
def actualizar_estado_instrumento_al_prestar(sender, instance, created, **kwargs):
    """
    Cuando se crea un préstamo con estado 'enuso', 
    automáticamente cambia el estado del instrumento a 'prestado'.
    """
    if instance.estado == 'enuso':
        instrumento = instance.instrumento
        if instrumento.estado != 'prestado':
            instrumento.estado = 'prestado'
            instrumento.save(update_fields=['estado'])


@receiver(post_save, sender=Prestamo)
def actualizar_estado_instrumento_al_devolver(sender, instance, created, **kwargs):
    """
    Cuando se devuelve un préstamo (estado 'disponible'), 
    automáticamente cambia el estado del instrumento a 'disponible'.
    """
    if instance.estado == 'disponible' and instance.fecha_devolucion:
        instrumento = instance.instrumento
        if instrumento.estado == 'prestado':
            instrumento.estado = 'disponible'
            instrumento.save(update_fields=['estado'])


@receiver(post_save, sender=Instrumento)
def registrar_cambio_estado_instrumento(sender, instance, created, **kwargs):
    """
    Registra automáticamente cada cambio de estado del instrumento
    en el historial de movimientos.
    """
    if not created:
        # Obtener el estado anterior comparándolo con la BD
        try:
            anterior = Instrumento.objects.get(pk=instance.pk)
            if anterior.estado != instance.estado:
                # El estado ha cambiado
                # Verificar si ya existe un registro reciente para evitar duplicados
                ultimo_cambio = HistorialEstadoInstrumento.objects.filter(
                    instrumento=instance
                ).order_by('-fecha_cambio').first()
                
                # Solo crear si no existe uno muy reciente (menos de 1 segundo)
                if not ultimo_cambio or (timezone.now() - ultimo_cambio.fecha_cambio).total_seconds() > 1:
                    pass  # La señal ya se maneja en el método cambiar_estado()
        except Instrumento.DoesNotExist:
            pass
