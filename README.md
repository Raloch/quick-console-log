# Quick Console Log

A Cursor extension for quickly generating console.log statements in JavaScript/TypeScript code.

## Features

- Quickly insert console.log statements with variable names
- Smart indentation handling, auto-aligns with code
- Support for object properties, array indices, and function calls
- Support for optional chaining operator (?.) and non-null assertion operator (!.)
- Batch comment/uncomment all console.log statements
- One-click removal of all console.log statements

## Supported Languages

- JavaScript (.js)
- TypeScript (.ts)
- React JSX (.jsx)
- React TSX (.tsx)

## Usage

### Basic Usage

1. Place cursor on any variable or expression
2. Press `Cmd/Ctrl + Shift + ,` to insert console.log (clean format)
3. Press `Cmd/Ctrl + Shift + .` to insert console.log (trace format)
4. The plugin will insert the log statement on the next line

### Keyboard Shortcuts

- `Cmd/Ctrl + Shift + ,`: Insert console.log (clean)
- `Cmd/Ctrl + Shift + .`: Insert console.log (trace)
- `Cmd/Ctrl + Shift + /`: Toggle comment all console.log statements
- `Cmd/Ctrl + Shift + D`: Remove all console.log statements

### Examples

```javascript
// Basic variable
const name = "John"; // cursor on name
console.log("👉 %c name", "color: #3b82f6", name);

// Object property
user.profile.age; // cursor on age
console.log("👉 %c user.profile.age", "color: #3b82f6", user.profile.age);

// Optional chaining
user?.profile?.name; // cursor on name
console.log("👉 %c user?.profile?.name", "color: #3b82f6", user?.profile?.name);

// Array index
users[0].name; // cursor on name
console.log("👉 %c users[0].name", "color: #3b82f6", users[0].name);

// Function call
getData(); // cursor on getData
console.log("👉 %c getData()", "color: #3b82f6", getData());
```

## Configuration

Available settings in the extension settings:

- `quickConsoleLog.format`: Log format (clean/trace)
  - clean: Simple format, shows only variable name and value
  - trace: Trace format, shows filename and line number
- `quickConsoleLog.indentStyle`: Indentation style (auto/space/tab)
  - auto: Automatically detect file's indentation style
  - space: Use space indentation
  - tab: Use tab indentation

## Notes

1. The plugin automatically detects code indentation level
2. Complex expressions maintain their original format
3. Smart handling of TypeScript type annotations
4. Currently supports JavaScript/TypeScript related file types only

## Future Plans

1. Support for more programming languages
2. Additional log format options
3. Custom log templates
4. More intelligent features

## Feedback

If you find any issues or have feature suggestions, please submit an issue on GitHub.

## License

MIT
