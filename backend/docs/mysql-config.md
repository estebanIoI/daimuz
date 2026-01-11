# Configuración de MySQL para Respaldos y Restauración

Para que el sistema pueda realizar respaldos y restauración de la base de datos correctamente, es necesario configurar las rutas a los comandos `mysql` y `mysqldump` en el servidor donde se ejecuta la aplicación.

## Configuración Automática

El sistema intentará detectar automáticamente la ubicación de MySQL en las siguientes rutas comunes:

### Windows
- C:\Program Files\MySQL\MySQL Server 8.0\bin
- C:\Program Files\MySQL\MySQL Server 5.7\bin
- C:\xampp\mysql\bin
- C:\wamp64\bin\mysql\mysql8.0.21\bin
- C:\wamp\bin\mysql\mysql8.0.21\bin
- C:\laragon\bin\mysql\bin

### Linux
- /usr/bin
- /usr/local/bin
- /usr/local/mysql/bin
- /opt/mysql/bin

### macOS
- /usr/bin
- /usr/local/bin
- /usr/local/mysql/bin
- /opt/homebrew/bin

## Configuración Manual

Si MySQL está instalado en una ubicación diferente, puede especificar la ruta manualmente en el archivo `.env`:

```
# Rutas a los comandos de MySQL (usar rutas completas si no están en el PATH)
MYSQL_PATH=C:\ruta\completa\a\mysql.exe
MYSQL_DUMP_PATH=C:\ruta\completa\a\mysqldump.exe
```

## Verificación de la instalación

Para verificar que los comandos de MySQL están disponibles, puede ejecutar:

1. Abrir una terminal o símbolo del sistema
2. Ejecutar:
   ```
   mysql --version
   mysqldump --version
   ```

Si estos comandos no funcionan, significa que MySQL no está en su PATH del sistema. 

## Soluciones comunes

1. **Instalar MySQL Client**: Si no tiene MySQL instalado, puede instalar solo el cliente sin necesidad del servidor completo.

2. **Agregar MySQL al PATH**: Alternativamente, puede agregar el directorio bin de MySQL a su variable de entorno PATH.

3. **Especificar rutas completas**: Use las variables MYSQL_PATH y MYSQL_DUMP_PATH en el archivo .env como se muestra arriba.

4. **Usar MySQL desde Docker**: Si prefiere no instalar MySQL en su máquina, puede ejecutar los comandos desde un contenedor Docker.
