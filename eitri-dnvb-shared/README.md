# eitri-dnvb-shared

SDK da plataforma DNVB para Eitri-Apps: conteúdo do CMS (`eitri-dnvb-api`) e dados do customer no Nexus
(o CRM do DNVB). Nada aqui é de uma marca: o que é da loja vem do CMS, do Remote Config ou do próprio app.

## Instalação

```js
'eitri-app-dependencies': {
	'eitri-dnvb-shared': { isEitriAppShared: true, version: '0.1.0' }
}
```

```ts
import { Dnvb, Nexus, CmsError, NexusError } from 'eitri-dnvb-shared'
```

| Export | O que é |
| --- | --- |
| `Dnvb` | `configure()`, `cms` (conteúdo genérico) e `journeys` (quiz e rotina do preset de jornada). |
| `Nexus` | `session`, `customer`, `db` (coleções) e `tracking`. |
| `CmsError`, `NexusError` | Erros com `code` e `status` HTTP. |
| Helpers do quiz | `resolveRoutine`, `matchOutcome`, `isQuizComplete`, `answerLabel(s)`, `interpolate`, `resolveReminderTime` e outros. |
| Tipos | `Quiz`, `Routine`, `RoutineRecord`, `NexusCollection`, `Filter` e os demais de `src/models`. |

## Configuração

`Dnvb.configure()` é opcional. Sem ele, valem as URLs de produção e o `applicationId` do Eitri-App
(`window.__eitriAppConf`). Ele lê a chave `dnvb` do Remote Config e aplica os overwrites por cima:

```json
{
	"dnvb": {
		"cmsUrl": "https://api.eitri.tech/eitri-dnvb-api/api",
		"nexusUrl": "https://api.eitri.tech/eitri-nexus",
		"applicationId": "<opcional>"
	}
}
```

```ts
await Dnvb.configure({ cmsUrl: 'https://<ngrok>/eitri-dnvb-api/api' })
```

Cada Eitri-App roda numa WebView com a própria instância do SDK: o overwrite vale só no app que chamou.

## CMS

### Conteúdo genérico

Qualquer content-type publicado, cru. O tipo genérico não valida nada: normalize o payload no app.

```ts
const pages = await Dnvb.cms.listContents('landing', { full: true })
const store = await Dnvb.cms.getContent<MinhaPagina>('landing', 'store')
```

O `filter` vira `filter[<campo>]=<valor>` e só funciona nos `indexes` do content-type.

### Jornada (quiz e rotina)

Os content-types `quiz` e `routine` do preset de jornada do DNVB, normalizados: `null` vira `undefined` ou
`[]`, item malformado some e seção desabilitada não chega.

```ts
const quiz = await Dnvb.journeys.getQuizByKind('onboarding')
const routine = resolveRoutine(quiz, answers)
const routines = await Dnvb.journeys.getRoutinesByProduct(productId)
```

- **Escolha da rotina** (`resolveRoutine`), na ordem que o CMS define: a primeira regra de `outcomes` em que
  todas as condições casam, depois a rotina da primeira opção escolhida que tiver uma, depois a `defaultRoutine`.
- **Blocos:** `choice`, `scale`, `photo`, `time`, `consent` e `text`. Um bloco de tipo novo chega como
  `UnknownBlock`, com os campos crus, e não trava o `isQuizComplete`.
- **Respostas** (`QuizAnswers`): `choice` grava `string[]` (o formato `"a,b"` ainda é aceito), `scale` um
  número, `time` `HH:MM`, `consent` um boolean e `text` uma string. Com `consent` obrigatório, só `true`
  conclui o quiz.
- **Rotina contínua:** `durationDays: null`. A janela que a tela mostra é decisão do app.
- **Lembrete:** `resolveReminderTime(reminder, answers)` devolve `null` quando não há horário. O horário
  padrão é decisão do app.
- **Blocos da rotina:** `steps`, `milestones` e `highlights` saem tipados. Campos que o tenant acrescentou aos
  blocos estão em `routine.sections`.

## Nexus

### Sessão

`Nexus.session.ensure()` registra a instalação só quando não há sessão salva. Nunca chame o `/register`
direto: cada register cria um customer vazio, e o anterior fica inacessível. A sessão fica no storage
compartilhado entre os Eitri-Apps, ou no do próprio app quando o container não tem AppGroup.

### Customer

```ts
await Nexus.customer.link(customerAccessToken)
const me = await Nexus.customer.me()
await Nexus.customer.update({ firstName: 'Ana' })
```

O `link` liga a instalação ao customer da conta logada. O Nexus confirma o token com a plataforma de
commerce; hoje só a Shopify (Customer Account API) é aceita, e as demais respondem `UNSUPPORTED_PLATFORM`.
O customer anônimo anterior fica para trás sem merge, então espere o link antes de salvar dados da conta.
Em 401 o `link` não registra de novo, porque o 401 pode ser do token da plataforma.

### Coleções (`Nexus.db`)

API no estilo do driver do Mongo, tipada pelo genérico:

```ts
interface Rotina extends RoutineRecord {
	weeklyPhotoOptIn: boolean
}

const routines = Nexus.db.collection<Rotina>('routines')

const ativas = await routines.find({ status: 'active' }, { sort: { startedAt: -1 } })
const comLembrete = await routines.findOne({ 'reminder.pushOptIn': true })
const recentes = await routines.countDocuments({ startedAt: { $gte: '2026-01-01' } })

await routines.insertOne({ key: 'r1', routineSlug: 'r1', status: 'active', startedAt: '2026-11-10', durationDays: 30, weeklyPhotoOptIn: false })
await routines.updateOne({ key: 'r1' }, { status: 'finished' })
await routines.upsert({ key: 'r1', routineSlug: 'r1', status: 'active', startedAt: '2026-11-10', durationDays: null, weeklyPhotoOptIn: true })
await routines.deleteMany({ status: 'replaced' })
```

| Método | Retorno |
| --- | --- |
| `find(query?, { sort, skip, limit }?)` | `T[]` |
| `findOne(query?, { sort }?)` / `findById(id)` | `T \| null` |
| `countDocuments(query?)` | `number` |
| `insertOne(doc)` | `T` |
| `updateOne(query, patch, { upsert }?)` | `T \| null` |
| `updateById(id, patch)` | `T` |
| `updateMany(query, patch)` | `T[]` |
| `deleteOne(query)` | `boolean` |
| `deleteById(id)` | `void` |
| `deleteMany(query)` | `number` de removidos |
| `upsert(doc com key)` | `T` |

- **Filtro:** igualdade, `$eq`, `$ne`, `$in`, `$nin`, `$gt`, `$gte`, `$lt`, `$lte`, `$exists`, `$and`, `$or`
  e caminhos com ponto (`'reminder.time'`). Em campo array, a igualdade casa quando o array contém o valor.
  A `query` também pode ser uma função `(doc) => boolean`. Operador desconhecido lança `INVALID_FILTER`.
- **Tudo roda no device.** O Nexus devolve a coleção inteira e não filtra nem pagina: cada `find` faz um GET
  da coleção toda, e os `update*`/`delete*` por filtro fazem o GET e depois uma escrita por item.
- **Patch:** o PATCH do Nexus mescla só as chaves de topo. Um objeto aninhado no patch (ex.: `reminder`)
  substitui o anterior inteiro.
- **Fila:** as escritas de uma coleção rodam em fila. Dois `upsert` da mesma `key` em paralelo não duplicam o item.
- **`id`, `createdAt` e `updatedAt`** são do SDK e do Nexus. Para registro idempotente, use `key` com `upsert`.
- **Limites:** nome `[A-Za-z0-9_-]{1,64}`, item até 32 KB e até 50 coleções por aplicação (`LIMIT_REACHED`).
- **Sem `link`, os dados vão para o customer anônimo da instalação.**

#### Coleção `routines`

É a única com formato fixo, porque o agendador de push do Nexus lê os itens dela. Ele agenda um push por
item com `status: 'active'`, `reminder.pushOptIn: true` e `reminder.permission` diferente de `denied`, no
`reminder.time`, de `startedAt` até `startedAt + durationDays`. Grave `durationDays: null` na rotina
contínua, em vez de omitir: o upsert faz PATCH e manteria o prazo antigo. Só customer com conta vinculada
recebe push.

### Tracking

```ts
Nexus.tracking.track('quiz.completed', { quizSlug: quiz.slug })
```

Fire-and-forget: nunca lança e nunca registra uma instalação. Sem sessão ou sem rede, o evento espera em
memória (até 50) e sai no próximo `track` que conseguir enviar.
