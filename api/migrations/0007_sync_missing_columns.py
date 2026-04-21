from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_remove_historialestadoinstrumento_estado_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE api_instrumento
                    ADD COLUMN IF NOT EXISTS ubicacion_fisica varchar(100) NULL,
                    ADD COLUMN IF NOT EXISTS valor_reemplazo numeric(10, 2) NULL,
                    ADD COLUMN IF NOT EXISTS fecha_creacion timestamp with time zone NULL,
                    ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp with time zone NOT NULL DEFAULT NOW();
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
                ALTER TABLE api_usuario
                    ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT TRUE,
                    ADD COLUMN IF NOT EXISTS fecha_creacion timestamp with time zone NULL,
                    ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp with time zone NOT NULL DEFAULT NOW(),
                    ADD COLUMN IF NOT EXISTS tipo varchar(20) NOT NULL DEFAULT 'estudiante';
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
                ALTER TABLE api_prestamo
                    ADD COLUMN IF NOT EXISTS dias_permitidos integer NOT NULL DEFAULT 7,
                    ADD COLUMN IF NOT EXISTS fecha_creacion timestamp with time zone NULL,
                    ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamp with time zone NOT NULL DEFAULT NOW(),
                    ADD COLUMN IF NOT EXISTS fecha_vencimiento date NULL,
                    ADD COLUMN IF NOT EXISTS observaciones text NULL;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]