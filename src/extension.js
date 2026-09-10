import * as vscode from 'vscode';
import { extractTargetLines } from './extractor';
export function activate(context) {
    const disposable = vscode.commands.registerCommand('geminiChecker.checkSyntax', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Abra um arquivo de código primeiro.');
            return;
        }
        const config = vscode.workspace.getConfiguration('geminiChecker');
        const apiKey = config.get('apiKey') || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            vscode.window.showErrorMessage('Configure sua Gemini API Key em Settings > Gemini Checker.');
            return;
        }
        const document = editor.document;
        const { languageId, lines } = extractTargetLines(document.getText(), document.languageId);
        const queryLines = lines.filter(l => l.text.trim().startsWith(':??'));
        if (queryLines.length === 0) {
            vscode.window.showInformationMessage('Nenhuma linha iniciada com ":??" encontrada.');
            return;
        }
        const formattedCode = lines.map(l => `L${l.lineNumber}: ${l.text}`).join('\n');
        const prompt = `Você é um validador de sintaxe para ${languageId}.
Analise APENAS as linhas marcadas com ":??". Use as declarações de função como contexto de escopo/tipos se necessário.
Para cada linha marcada com ":??", responda se a sintaxe está correta ou aponte o erro e a correção exata.

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
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            outputChannel.appendLine(response.text || 'Sem resposta.');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Erro na API: ${error.message}`);
        }
    });
    context.subscriptions.push(disposable);
}
export function deactivate() { }
