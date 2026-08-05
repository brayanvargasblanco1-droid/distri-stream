#!/bin/bash
# DISTRITO STREAMING - Deploy Script
# Uso: bash deploy.sh

echo "═══════════════════════════════════════"
echo "  DISTRITO STREAMING - Deploy"
echo "═══════════════════════════════════════"

# Verificar cambios
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No hay cambios para commit"
    echo "El repositorio ya está al día"
    exit 0
fi

echo ""
echo "📋 Cambios detectados:"
git status --short
echo ""

# Pedir mensaje
echo "📝 Ingresa el mensaje de commit:"
read mensaje

if [ -z "$mensaje" ]; then
    echo "❌ Debes ingresar un mensaje"
    exit 1
fi

# Deploy
echo ""
echo "🚀 Haciendo commit y push..."
git add -A
git commit -m "$mensaje"
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy completado exitosamente!"
    echo "🔗 https://github.com/vargasblancobrayan-cyber/distri-stream"
else
    echo ""
    echo "❌ Error al hacer push"
fi
