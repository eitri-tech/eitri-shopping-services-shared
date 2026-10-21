# Classificacao de Erros de Checkout VTEX

## Contexto

Durante o fluxo de pagamento (`executePayment` e `pay`), erros retornados pela API VTEX sao classificados em duas categorias com base no codigo de erro presente em `e.response.data.error.code`.

## Categorias

### ORDER-NOT-COMPLETED (`APP-SHOPPING-ORDER-NOT-COMPLETED`)

Erros onde **o usuario precisa agir** — nao sao falhas do sistema. Exemplos: sessao expirada, pagamento recusado pelo emissor, email invalido.

Esses erros sao enviados ao Datadog com origin `APP-SHOPPING-ORDER-NOT-COMPLETED` via `sendOrderNotComplete`. Devem ser filtrados em dashboards de saude do sistema — nao indicam bugs.

### ERROR (`APP-SHOPPING-ERROR`)

Erros onde **algo quebrou do nosso lado** ou do lado da VTEX. Exemplos: falha de comunicacao com gateway, erro interno do checkout, timeout de servico.

Esses erros sao enviados ao Datadog com origin `APP-SHOPPING-ERROR` via `sendLogError`. Devem acionar alertas e investigacao.

## Lista de codigos ORDER-NOT-COMPLETED

Definida em `src/services/vtex/checkout/notCompleteErrors.ts`:

| Codigo | Mensagem VTEX | Motivo da classificacao |
|--------|--------------|------------------------|
| CHK0016 | Payment value does not match with reference value | Carrinho mudou entre selecao e pagamento |
| CHK003 | Access denied | Sessao expirada ou token invalido |
| CHK0080 | Maximum denied transactions reached (24h) | Usuario bloqueado por tentativas |
| CHK0081 | Specified user is not valid | Perfil invalido |
| CHK0085 | Order already exists | Double-click — pedido duplicado |
| CHK0087 | Login required to use a new address | Precisa logar |
| CHK0109 | Email belongs to another user | Conflito de conta |
| CHK0131 | Invalid e-mail | Email invalido no perfil |
| CHK0209 | No payment selected | Meio de pagamento nao selecionado |
| CHK0223 | Payment not authorized | Pagamento recusado pelo emissor |
| CHK0246 | Purchase with unavailable items | Items indisponiveis |
| CHK0328 | (nao documentado) | Codigo legado/interno — mantido por historico |
| ORD007 | Invalid client profile field | Campo obrigatorio do perfil invalido |
| ORD023 | Unavailable items in cart | Items indisponiveis no carrinho |
| ORD062 | Access denied / Unauthorized | Autenticacao necessaria |

## Erros que permanecem como ERROR (exemplos)

Qualquer codigo **fora** da lista acima e logado como `APP-SHOPPING-ERROR`. Exemplos tipicos:

| Codigo | Mensagem | Por que e ERROR |
|--------|---------|----------------|
| CHK002 | Gateway endpoint not provided | Erro de configuracao |
| CHK0012 | Communication error with gateway | Falha de comunicacao |
| CHK0076 | Communication error with payment system | Falha de comunicacao |
| CHK0197 | Could not process orderForm | Erro interno do checkout |
| CHK0230 | Could not process payments | Erro interno do checkout |
| CHK0265 | Communication error with gateway | Falha de comunicacao |

## Como funciona no codigo

```
catch (e) {
    const errorCode = e.response?.data?.error?.code

    if (NOT_COMPLETE_ERRORS.includes(errorCode)) {
        sendOrderNotComplete(...)  // -> APP-SHOPPING-ORDER-NOT-COMPLETED
    } else {
        sendLogError(...)          // -> APP-SHOPPING-ERROR
    }
}
```

Os pontos de log sao centralizados em `executePayment` (`vtexPaymentService.ts`) e `pay` (`vtexCheckoutService.js`). Sub-metodos (`startTransaction`, `setPaymentMethod`, `processPayment`) enriquecem o erro com `e.step` e `e.stepContext` mas nao logam — evitando duplicacao.

## Como adicionar novos codigos

1. Consultar a documentacao VTEX: https://developers.vtex.com/docs/guides/checkout-error-codes
2. Avaliar se o erro e "usuario precisa agir" ou "algo quebrou"
3. Se for acao do usuario, adicionar o codigo em `notCompleteErrors.ts`
4. Atualizar este documento

## Referencia

- Documentacao oficial: https://developers.vtex.com/docs/guides/checkout-error-codes
- Arquivo fonte: `eitri-shopping-vtex-shared/src/services/vtex/checkout/notCompleteErrors.ts`
