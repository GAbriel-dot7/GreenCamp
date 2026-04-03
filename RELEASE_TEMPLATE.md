# Release Template

## Versao
- Tag/versao:
- Data:
- Responsavel:

## Objetivo da release
- 

## Mudancas principais
1. 
2. 
3. 

## Impacto esperado
- Cliente/cardapio:
- Admin/pedidos:
- Banco/Supabase:

## Riscos conhecidos
1. 
2. 

## Plano de validacao rapida (2-5 min)
1. Rodar smoke test:

```bash
bash scripts/smoke-check.sh
```

2. Validar fluxo rapido:
- abrir cardapio
- abrir admin
- criar pedido
- confirmar recebimento no admin

## Rollback
1. Reverter deploy estatico para build anterior.
2. Se houver mudanca SQL nesta release, usar script de rollback correspondente.
3. Reexecutar smoke test e validar fluxo minimo.

## SQL aplicado nesta release
- [ ] Nenhum
- [ ] Sim (listar):

## Status final
- [ ] Aprovada para producao
- [ ] Bloqueada
- Observacoes:
