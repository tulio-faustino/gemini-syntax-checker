export function extractTargetLines(fullText, languageId) {
    const lines = fullText.split('\n');
    const extracted = [];
    // Regex para identificar declarações de funções comuns (JS/TS, Python, C/C++, Rust, Go)
    const funcDeclRegex = /^\s*(function\s+\w+|def\s+\w+|const\s+\w+\s*=\s*(\(.*\)|async\s*\(.*\))\s*=>|async\s+function\s+\w+|\w+\s+\w+\s*\(.*\)\s*\{?|fn\s+\w+)/;
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Linhas marcadas com :??
        if (trimmed.startsWith(':??')) {
            extracted.push({
                lineNumber: index + 1,
                text: line
            });
            return;
        }
        // Declarações de função para dar contexto de assinatura/escopo
        if (funcDeclRegex.test(line)) {
            extracted.push({
                lineNumber: index + 1,
                text: line
            });
        }
    });
    return { languageId, lines: extracted };
}
