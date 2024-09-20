#!/bin/bash

# Função para aumentar a versão do Eitri App Shared
bumpEitriAppSharedVersion() {

    JS_FILE="./eitri-app.conf.js"


    # Extrai a versão atual
    CURRENT_VERSION=$(grep -o "'version': '[^']*'" "$JS_FILE" | cut -d "'" -f 4)

    # Incrementa o patch da versão
    IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
    PATCH=$((VERSION_PARTS[2] + 1))
    NEW_VERSION="${VERSION_PARTS[0]}.${VERSION_PARTS[1]}.$PATCH"


    # Substitui a versão no arquivo
    sed -i '' "s/'version': \'$CURRENT_VERSION\'/\'version\': \'$NEW_VERSION\'/" "$JS_FILE"

    echo "$NEW_VERSION"

}

# Função para executar 'eitri push-version'
executePushVersion() {
    eitri push-version --shared
}

# Função principal
push() {

    echo "Fazendo o bump da versão"

    bumpEitriAppSharedVersion

    echo "Publicando Eitri App"

    executePushVersion
}

# Chama a função principal
push
