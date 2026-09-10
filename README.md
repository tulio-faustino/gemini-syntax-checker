# Gemini Syntax Checker

Uma extensão minimalista e econômica para o Visual Studio Code projetada para validar a sintaxe de trechos de código sob demanda via API do Google Gemini, minimizando o consumo de tokens.

---

## Como Funciona

Em vez de enviar o arquivo inteiro para o modelo, a extensão extrai apenas o estritamente necessário:

* **Assinaturas de Função:** Captura as declarações de funções para fornecer contexto de escopo, tipos e parâmetros.
* **Linhas Marcadas (`:??`):** Envia exclusivamente as linhas que você prefixar com o marcador `:??`.

O Gemini analisa essas linhas no contexto da função correspondente e devolve correções sintáticas, validação de argumentos e explicações diretamente no canal de saída do editor.

---

## Exemplo de Uso

No seu código, adicione o prefixo `:??` no início da linha sobre a qual você tem dúvida de sintaxe:

```python
def process_data(items, multiplier):
    # O contexto da função acima é capturado automaticamente
    :?? result = [x ** multiplier for x in items if x != None]
    return result