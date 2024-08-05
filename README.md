# CCSH (Custom Command Shell) Documentation

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [How to Run](#how-to-run)
3. [Features](#features)
   3.1 [Basic Command Execution](#basic-command-execution)
   3.2 [Built-in Commands](#built-in-commands)
   3.3 [Input/Output Redirection](#inputoutput-redirection)
   3.4 [Piping](#piping)
   3.5 [Background Jobs](#background-jobs)
   3.6 [Aliases](#aliases)
   3.7 [History](#history)
   3.8 [Tab Completion](#tab-completion)
   3.9 [Variable Expansion](#variable-expansion)
   3.10 [Configuration File](#configuration-file)
   3.11 [Scripting](#scripting)

## 1. Introduction 🌟

CCSH is a custom command shell implemented in Node.js. It provides an interactive command-line interface with various features commonly found in Unix-like shells, bringing power and flexibility to your command-line experience! 💪

## 2. How to Run 🏃‍♂️

1. Ensure you have [Node.js](https://nodejs.org/) installed on your system.
2. Save the provided code in a file named `ccsh.js`.
3. Open a terminal and navigate to the directory containing `ccsh.js`.
4. Run the shell using the command:
   ```
   node ccsh.js
   ```
5. You should see the CCSH prompt: `ccsh>` 🎉

## 3. Features 🌈

### 3.1 Basic Command Execution ⚡

CCSH can execute any system commands and binaries available in your system's PATH.

Example:

```
ccsh> ls -l
```

### 3.2 Built-in Commands 🛠️

CCSH provides several built-in commands:

- `cd [directory]`: Change the current working directory. 🏠
- `pwd`: Print the current working directory. 📂
- `echo [text]`: Print the given text to the console. 🗣️
- `exit`: Exit the shell. 👋
- `history`: Display command history. 📜
- `alias`: Manage command aliases. 🏷️
- `unalias`: Remove an alias. 🗑️
- `jobs`: List background jobs. 👷
- `fg`: Bring a background job to the foreground. ⬆️
- `bg`: Resume a stopped background job. ▶️
- `source`: Execute a script file. 📄

### 3.3 Input/Output Redirection 🔀

CCSH supports input and output redirection:

- Input redirection: `<` 📥
- Output redirection: `>` 📤
- Append output: `>>` ➕

Examples:

```
ccsh> cat < input.txt
ccsh> echo "Hello" > output.txt
ccsh> echo "World" >> output.txt
```

### 3.4 Piping 🚀

You can pipe the output of one command to another using the `|` operator.

Example:

```
ccsh> ls -l | grep ".txt"
```

### 3.5 Background Jobs 🕰️

Run commands in the background by appending `&` to the command.

Example:

```
ccsh> long_running_command &
```

Use `jobs`, `fg`, and `bg` to manage background jobs.

### 3.6 Aliases 🏷️

Create and manage command aliases:

- Set an alias: `alias name='command'`
- List all aliases: `alias`
- Remove an alias: `unalias name`

Example:

```
ccsh> alias ll='ls -l'
```

### 3.7 History 📜

- View command history: `history`
- Clear history: `history -c`
- Search history: `history -s searchterm`

### 3.8 Tab Completion 🔍

CCSH provides tab completion for commands, aliases, and built-in commands. Just start typing and hit Tab! ⌨️

### 3.9 Variable Expansion 🔮

Environment variables can be expanded using the `$` symbol.

Example:

```
ccsh> echo $HOME
```

### 3.10 Configuration File ⚙️

CCSH uses a configuration file located at `~/.ccshrc`. This file is created automatically and stores aliases.

### 3.11 Scripting 📝

CCSH supports basic scripting capabilities:

- Execute a script file: `source scriptfile.sh`
- Basic `if` statements are supported in scripts

Example script:

```bash
if [ -f "somefile.txt" ]
then
    echo "File exists"
fi
```

> 📘 **Note:** `for` and `while` loops are not implemented in this version.

---

This documentation provides an overview of CCSH's features. For more detailed information on specific commands or features, refer to the source code or experiment with the shell interactively. Happy coding! 🎈🎊

## 🔗 Useful Links

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Bash Manual](https://www.gnu.org/software/bash/manual/)
- [Learn Shell Scripting](https://www.shellscript.sh/)

## 🌟 Contributing

We welcome contributions to CCSH! Feel free to fork the repository, make your changes, and submit a pull request. Together, we can make CCSH even more powerful! 💪

## 📞 Support

If you encounter any issues or have questions, please open an issue in the GitHub repository or contact our support team.

---

Thank you for using CCSH! We hope it enhances your command-line experience. 🚀
