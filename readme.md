# 📁 fs-watch-cli

> A lightweight CLI tool that watches files or folders and automatically runs any command when changes are detected — built with Node.js and TypeScript.

---

## 🧠 Project Description

`fs-watch-cli` is a small, developer-focused tool created to simplify the process of watching files and triggering scripts during development.

Inspired by tools like `nodemon`, this tool was built out of curiosity: *how do file watchers really work under the hood?* Instead of relying on external libraries or prebuilt solutions, `fs-watch-cli` is implemented using native Node.js modules — providing both functionality and learning value.

Whether you're rebuilding code, restarting scripts, or running tests, this tool helps automate repetitive steps and keeps your development flow smooth.

---

## 📦 Installation

For now, clone the repository and install it locally:

```bash
git clone https://github.com/your-username/fs-watch-cli
cd fs-watch-cli
npm install
npm link   # Makes the CLI accessible globally on your system
```

## ⚙️ Usage
`fs-watch-cli <path-to-watch> <commandToExecute>`

## ✅ Example
`fs-watch-cli ./src "npm run build"`
This will watch every file in the ./src folder. Anytime you make a change, it will automatically run npm run build.

## 🚀 Features
- 🔁 Recursive Watching – Monitors all files and subfolders.

- ⚡ Auto Command Execution – Runs any shell command on changes.

- 🧘 Minimal Setup – No config files or scripts needed.

- 📦 Pure Node.js + TypeScript – No unnecessary dependencies.

- 🎨 Colored Logs – Uses chalk for better terminal output.

- 🧯 Graceful Handling – Catches errors and cleanly exits on Ctrl + C.

## 🧪 Use Cases
- ✅ Auto-build during development
`fs-watch-cli ./src "npm run build"`

- ✅ Re-run tests when test files change
`fs-watch-cli ./tests "npm test"`

- ✅ Auto-restart a script on change
`fs-watch-cli ./server "node index.js"`

## 🧠 How It Works
- Uses fs.watch to monitor files and folders.

- When a file changes, the CLI:

- Logs the filename to the terminal.

- Executes the provided command using child_process.exec.

- Displays standard output and error messages.

Catches:

- File watching errors

- Uncaught exceptions

Process termination signals like SIGINT and SIGTERM

## 👥 Contributing
All contributions are welcome!

To contribute:
Fork this repository
Create a new branch
git checkout -b your-feature-name
Make your changes
Commit and push


git commit -m "Add a new feature"
git push origin your-feature-name
Open a pull request describing your changes

## 📜 License
MIT License © 2025 [Accoladesio]

## ✍️ Author’s Note
This project started with a simple question:
“How does a tool like nodemon actually work?”

Instead of reading a blog post, I decided to build something similar myself — but smaller and easier to understand.

That led to fs-watch-cli. It helped me learn about file watching, shell command execution, and graceful process handling in Node.js. I hope it helps others too — either as a dev tool or a learning reference.

If you give it a try or find ways it could improve, I’d love to hear from you.
