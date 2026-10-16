import * as vscode from 'vscode';
import { extractTargetLines } from './extractor';

export function activate(context: vscode.ExtensionContext) {
const disposable = vscode.commands.registerCommand('geminiChecker.checkSyntax', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Abra um arquivo de código primeiro.');
      return;
    }

    const config = vscode.workspace.getConfiguration('geminiChecker');
    const apiKey = config.get<string>('apiKey') || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      vscode.window.showErrorMessage('Configure sua Gemini API Key em Settings > Gemini Checker.');
      return;
    }

    const document = editor.document;
    const { languageId, lines } = extractTargetLines(document.getText(), document.languageId);

    // Mapeia os índices de todas as linhas que começam com ':??'
    const queryLineIndices = lines
      .map((l, index) => l.text.trim().startsWith(':??') ? index : -1)
      .filter(index => index !== -1);

    if (queryLineIndices.length === 0) {
      vscode.window.showInformationMessage('Nenhuma linha iniciada com ":??" encontrada.');
      return;
    }

    // Utiliza um Set para evitar linhas duplicadas se marcações estiverem próximas
    const contextIndices = new Set<number>();

    for (const index of queryLineIndices) {
      const start = Math.max(0, index - 3);
      const end = Math.min(lines.length - 1, index + 3);
      for (let i = start; i <= end; i++) {
        contextIndices.add(i);
      }
    }

    // Converte o Set de volta para array, ordena os índices e formata
    const formattedCode = Array.from(contextIndices)
      .sort((a, b) => a - b)
      .map(index => `L${lines[index].lineNumber}: ${lines[index].text}`)
      .join('\n');
    const prompt = `Você é um validador de sintaxe para ${languageId}.
Analise APENAS as linhas marcadas com ":??". Use as declarações de função e de variáveis como contexto de escopo/tipos se necessário.
Para cada linha marcada com ":??", responda se a sintaxe está correta ou aponte o erro e a correção exata. Se houver um comentário com um pedido ou pergunta, responda.

Código:
\`\`\`${languageId}
${formattedCode}
\`\`\``;

    const outputChannel = vscode.window.createOutputChannel('Gemini Syntax Checker');
    outputChannel.show(true);
    outputChannel.appendLine('Consultando Gemini...\n');

    try {
      // Import dinâmico resolve o conflito CommonJS vs ESM
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
      });

      outputChannel.appendLine(response.text || 'Sem resposta.');
    } catch (error: any) {
      vscode.window.showErrorMessage(`Erro na API: ${error.message}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}