# API-Biblioteca

## 📘 Documentación de la API

Para ver la documentación abra el siguiente enlace: 

🔗 **[Ver documentación en Postman](https://www.postman.com/fernandorivera-7297391/workspace/api-biblioteca/collection/44228915-780d446c-28f1-44a5-b7cd-4fe8b5b827b5?action=share&creator=44228915)**

## 📝 Instrucciones para instalar y ejecutar la API

### Ejecutar el siguiente comando para clonar el repositorio en el directorio que desee:

```
git clone https://github.com/acarias11/Proyecto_Disenio.git
```

### Una vez clonado ingrese el siguiente comando para descargar las dependencias necesarias:

*Necesita tener descargado Nodejs y npm para ejecutar estos comando*

```
npm install
```

### Será necesario agregar un archivo .env con las siguientes variables de entorno para que el servidor funcione

```
PORT=3000
SECRET_KEY=Jeheiwlskzbevwgwllkwue9wosb 
DB_USER=angel.carias
DB_PASSWORD=AC20222001305
DB_HOST=3.128.144.165
DB_NAME=DB20222001305
```

La variable PORT es el puerto en el que el servidor estará corriendo, se puede modificar a como se encuentra más conveniente.

La variable SECRET_KEY es la clave secreta que se utilizará al momento de crear los tokens de autenticación, se puede modificar a como se encuentre más conveniente.   

## Para poner en marcha el servidor:
### Ejecute el siguiente comando para encender el servidor en modo de desarrollo

Con este comando las actualizaciones realizadas al código se veran reflejadas en tiempo real

```
npm run dev
```

### Ejecute el siguiente comando para encender el servidor en modo de producción

```
npm run start
```

---
### Los archivos en la carpeta `tests` contienen las distintas pruebas realizadas a la API

Estos archivos .http podrán usarse si se tiene descargada la extensión de **REST Client** en Visual Studio Code o con el cliente que estime más conveniente.

## 👥 Proyecto Realizado por:

**Fernando Josué Rivera Sosa**

**Carlos Andres Rivera Zelaya**

**Angel Andres Carias Castillo**



