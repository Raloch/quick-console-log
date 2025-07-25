import * as vscode from "vscode";
import * as path from "path";

interface LogPosition {
  line: number;
  indent: string;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('插件 "quick-console-log" 已激活！');

  // 注册命令
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

// 插入console.log语句
async function insertConsoleLog(format: "clean" | "trace" = "clean") {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const position = editor.selection.active;
  const currentLine = document.lineAt(position.line);

  // 获取表达式
  const expression = await getExpression(document, position);
  if (!expression) return;

  // 获取插入位置和缩进
  const insertPosition = findInsertPositionAndIndent(document, position.line);

  // 生成日志语句
  const logStatement = generateLogStatement(
    expression,
    insertPosition.indent,
    format,
    {
      fileName: path.basename(document.fileName),
      lineNumber: position.line + 1,
    }
  );

  // 插入日志
  editor.edit((editBuilder) => {
    const pos = new vscode.Position(insertPosition.line, 0);
    editBuilder.insert(pos, logStatement);
  });
}

// 查找插入位置和合适的缩进
function findInsertPositionAndIndent(
  document: vscode.TextDocument,
  currentLineNumber: number
): LogPosition {
  const lineCount = document.lineCount;
  const currentLine = document.lineAt(currentLineNumber);
  const currentIndent = currentLine.text.match(/^\s*/)?.[0] || "";

  // 查找下一个非空行
  let nextNonEmptyLine: vscode.TextLine | undefined;
  for (let i = currentLineNumber + 1; i < lineCount; i++) {
    const line = document.lineAt(i);
    if (line.text.trim().length > 0) {
      nextNonEmptyLine = line;
      break;
    }
  }

  // 如果找到了下一个非空行，比较缩进
  if (nextNonEmptyLine) {
    const nextIndent = nextNonEmptyLine.text.match(/^\s*/)?.[0] || "";

    // 比较缩进长度，使用更长的那个（更深的缩进）
    const indent =
      nextIndent.length >= currentIndent.length ? nextIndent : currentIndent;

    return {
      line: currentLineNumber + 1,
      indent,
    };
  }

  // 如果没有下一个非空行，使用当前行的缩进
  return {
    line: currentLineNumber + 1,
    indent: currentIndent,
  };
}

// 获取表达式
async function getExpression(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<string | undefined> {
  // 获取光标所在位置的单词范围
  let wordRange = document.getWordRangeAtPosition(position);
  if (!wordRange) return;

  let text = document.getText();
  let lines = text.split("\n");
  let currentLine = lines[position.line];

  // 获取完整表达式
  let expression = document.getText(wordRange);
  let startChar = wordRange.start.character;
  let endChar = wordRange.end.character;

  // 向前查找对象属性、数组索引、可选链和非空断言
  for (let i = startChar - 1; i >= 0; i--) {
    let char = currentLine[i];
    let nextChar = currentLine[i + 1] || "";
    let prevChar = currentLine[i - 1] || "";

    // 检查可选链操作符 ?.
    if (char === "?" && nextChar === ".") {
      startChar = i;
      continue;
    }
    // 检查非空断言操作符 !.
    if (char === "!" && nextChar === ".") {
      startChar = i;
      continue;
    }
    // 检查普通属性访问或数组索引
    if (char === "." || char === "[") {
      startChar = i;
      continue;
    }
    // 检查标识符字符
    if (!/[\w\]$]/.test(char)) break;
    startChar = i;
  }

  // 向后查找对象属性、数组索引、可选链和非空断言
  for (let i = endChar; i < currentLine.length; i++) {
    let char = currentLine[i];
    let nextChar = currentLine[i + 1] || "";

    // 检查属性访问、数组索引结束
    if (char === "." || char === "[" || char === "]") {
      endChar = i + 1;
      continue;
    }
    // 检查可选链操作符 ?.
    if (char === "?" && nextChar === ".") {
      endChar = i + 2;
      continue;
    }
    // 检查非空断言操作符 !.
    if (char === "!" && nextChar === ".") {
      endChar = i + 2;
      continue;
    }
    // 检查标识符字符
    if (!/[\w\]]/.test(char)) break;
    endChar = i + 1;
  }

  // 获取完整表达式
  expression = currentLine.substring(startChar, endChar);

  // 处理函数调用
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

// 生成日志语句
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

// 切换所有console.log的注释状态
async function toggleConsoleLogComments() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();

  // 查找所有console.log
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

  // 应用编辑
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.set(document.uri, edits);
  await vscode.workspace.applyEdit(workspaceEdit);
}

// 删除所有console.log
async function removeConsoleLogs() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const document = editor.document;
  const text = document.getText();

  // 查找所有console.log语句
  const regex = /^.*console\.log\(.*\);?\s*\n/gm;
  const newText = text.replace(regex, "");

  // 替换整个文档内容
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(text.length)
  );

  editor.edit((editBuilder) => {
    editBuilder.replace(fullRange, newText);
  });
}

export function deactivate() {}
