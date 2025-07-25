import * as vscode from "vscode";
import * as path from "path";

interface LogPosition {
  line: number;
  indent: string;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "quick-console-log" is now active!');

  // Register commands
  let insertLog = vscode.commands.registerCommand(
    "quick-console-log.insertLog",
    () => {
      insertConsoleLog("clean");
    }
  );

  let insertLogTrace = vscode.commands.registerCommand(
    "quick-console-log.insertLogTrace",
    () => {
      insertConsoleLog("trace");
    }
  );

  let commentAllLogs = vscode.commands.registerCommand(
    "quick-console-log.commentAllLogs",
    () => {
      toggleConsoleLogComments();
    }
  );

  let removeAllLogs = vscode.commands.registerCommand(
    "quick-console-log.removeAllLogs",
    () => {
      removeConsoleLogs();
    }
  );

  context.subscriptions.push(
    insertLog,
    insertLogTrace,
    commentAllLogs,
    removeAllLogs
  );
}

// Insert console.log statement
async function insertConsoleLog(format: "clean" | "trace" = "clean") {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const position = editor.selection.active;
  const currentLine = document.lineAt(position.line);

  // Get expression
  const expression = await getExpression(document, position);
  if (!expression) return;

  // Get insertion position and indentation
  const insertPosition = findInsertPositionAndIndent(document, position.line);

  // Generate log statement
  const logStatement = generateLogStatement(
    expression,
    insertPosition.indent,
    format,
    {
      fileName: path.basename(document.fileName),
      lineNumber: position.line + 1,
    }
  );

  // Insert log
  editor.edit((editBuilder) => {
    const pos = new vscode.Position(insertPosition.line, 0);
    editBuilder.insert(pos, logStatement);
  });
}

// Find insertion position and appropriate indentation
function findInsertPositionAndIndent(
  document: vscode.TextDocument,
  currentLineNumber: number
): LogPosition {
  const lineCount = document.lineCount;
  const currentLine = document.lineAt(currentLineNumber);
  const currentIndent = currentLine.text.match(/^\s*/)?.[0] || "";

  // Find next non-empty line
  let nextNonEmptyLine: vscode.TextLine | undefined;
  for (let i = currentLineNumber + 1; i < lineCount; i++) {
    const line = document.lineAt(i);
    if (line.text.trim().length > 0) {
      nextNonEmptyLine = line;
      break;
    }
  }

  let indent = currentIndent;

  // Use indentation from next non-empty line if found and it's deeper
  if (nextNonEmptyLine) {
    const nextIndent = nextNonEmptyLine.text.match(/^\s*/)?.[0] || "";
    indent =
      nextIndent.length >= currentIndent.length ? nextIndent : currentIndent;
  }

  return {
    line: currentLineNumber + 1,
    indent,
  };
}

// Get expression from cursor position
async function getExpression(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<string | undefined> {
  // Get word range at cursor position
  let wordRange = document.getWordRangeAtPosition(position);
  if (!wordRange) return;

  let text = document.getText();
  let lines = text.split("\n");
  let currentLine = lines[position.line];

  // Get complete expression
  let expression = document.getText(wordRange);
  let startChar = wordRange.start.character;
  let endChar = wordRange.end.character;

  // Search backwards for object properties, array indices, optional chaining, and non-null assertions
  for (let i = startChar - 1; i >= 0; i--) {
    let char = currentLine[i];
    let nextChar = currentLine[i + 1] || "";
    let prevChar = currentLine[i - 1] || "";

    // Check for optional chaining operator ?.
    if (char === "?" && nextChar === ".") {
      startChar = i;
      continue;
    }
    // Check for non-null assertion operator !.
    if (char === "!" && nextChar === ".") {
      startChar = i;
      continue;
    }
    // Check for regular property access or array index
    if (char === "." || char === "[") {
      startChar = i;
      continue;
    }
    // Check for identifier characters
    if (!/[\w\]$]/.test(char)) break;
    startChar = i;
  }

  // Search forwards for object properties, array indices, optional chaining, and non-null assertions
  for (let i = endChar; i < currentLine.length; i++) {
    let char = currentLine[i];
    let nextChar = currentLine[i + 1] || "";

    // Check for property access and array index end
    if (char === "." || char === "[" || char === "]") {
      endChar = i + 1;
      continue;
    }
    // Check for optional chaining operator ?.
    if (char === "?" && nextChar === ".") {
      endChar = i + 2;
      continue;
    }
    // Check for non-null assertion operator !.
    if (char === "!" && nextChar === ".") {
      endChar = i + 2;
      continue;
    }
    // Check for identifier characters
    if (!/[\w\]]/.test(char)) break;
    endChar = i + 1;
  }

  // Get complete expression
  expression = currentLine.substring(startChar, endChar);

  // Handle function calls
  if (currentLine.substring(endChar).trim().startsWith("(")) {
    let bracketCount = 1;
    for (let i = endChar + 1; i < currentLine.length; i++) {
      let char = currentLine[i];
      if (char === "(") bracketCount++;
      if (char === ")") bracketCount--;
      if (bracketCount === 0) {
        expression = currentLine.substring(startChar, i + 1);
        break;
      }
    }
  }

  return expression;
}

interface LogContext {
  fileName: string;
  lineNumber: number;
}

// Generate log statement
function generateLogStatement(
  expression: string,
  indent: string,
  format: "clean" | "trace",
  context: LogContext
): string {
  let logTemplate: string;

  switch (format) {
    case "clean":
      logTemplate = `${indent}console.log('👉 %c ${expression}', 'color: #3b82f6', ${expression});\n`;
      break;
    case "trace":
      logTemplate = `${indent}console.log('👉 %c [${context.fileName}:${context.lineNumber}] ${expression}', 'color: #3b82f6', ${expression});\n`;
      break;
    default:
      logTemplate = `${indent}console.log('👉 %c ${expression}', 'color: #3b82f6', ${expression});\n`;
  }

  return logTemplate;
}

// Toggle comments for all console.log statements
async function toggleConsoleLogComments() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();

  // Find all console.log statements
  const regex = /^(\s*)(\/\/\s*)?console\.log\(/gm;
  let match;
  let edits: vscode.TextEdit[] = [];

  while ((match = regex.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const lineText = document.lineAt(startPos.line).text;
    const isCommented = match[2] !== undefined;

    const newText = isCommented
      ? lineText.replace(/\/\/\s*/, "")
      : lineText.replace(/^(\s*)/, "$1// ");

    edits.push(
      vscode.TextEdit.replace(
        new vscode.Range(startPos.line, 0, startPos.line, lineText.length),
        newText
      )
    );
  }

  // Apply edits
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(document.uri, edits);
  await vscode.workspace.applyEdit(workspaceEdit);
}

// Remove all console.log statements
async function removeConsoleLogs() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();

  // Find all console.log statements
  const regex = /^.*console\.log\(.*\);?\s*\n/gm;
  const newText = text.replace(regex, "");

  // Replace entire document content
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(text.length)
  );

  editor.edit((editBuilder) => {
    editBuilder.replace(fullRange, newText);
  });
}

export function deactivate() {}
