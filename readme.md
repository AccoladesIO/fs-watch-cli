# fs-watch-cli

> A simple CLI tool to watch file changes and run custom commands — like a mini version of `nodemon`.


## 🔍 What is it?

`fs-watch-cli` is a lightweight developer tool built with Node.js and TypeScript that **watches your file or directory** for changes and **automatically executes any command you provide**.

No more manually running `npm run build` after every small edit — let the CLI handle it for you!

---

## ⚙️ Usage

`fs-watch-cli <path-to-watch> <commandToExecute>`
- Example: `fs-watch-cli ./src "npm run build"`

---


## 🚀 Features

- ✅ Watch any folder or file recursively
- ✅ Automatically run your command on changes
- ✅ Easy to set up — no config files
- ✅ Pure Node.js — no extra dependencies (except `chalk` for colored logs)
- ✅ Gracefully handles crashes and exits

---

## 📦 Installation

You can clone and run it locally for now (soon to be published to npm):

```bash
git clone https://github.com/your-username/fs-watch-cli
cd fs-watch-cli
npm install
npm link



# fs-watch-cli
