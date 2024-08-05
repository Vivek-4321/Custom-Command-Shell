const readline = require('readline');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'ccsh> ',
  completer: tabCompletion
});

const history = [];
const historyFile = path.join(os.homedir(), '.ccsh_history');
const configFile = path.join(os.homedir(), '.ccshrc');
const aliases = {};
const jobs = [];

function loadConfig() {
  try {
    const config = fs.readFileSync(configFile, 'utf8');
    const lines = config.split('\n');
    lines.forEach(line => {
      if (line.startsWith('alias ')) {
        const [, name, command] = line.match(/alias (\w+)='(.+)'/);
        aliases[name] = command;
      }
    });
  } catch (err) {
    console.log('No config file found. Creating a new one.');
    fs.writeFileSync(configFile, '# CCSH Configuration File\n', 'utf8');
  }
}

function saveConfig() {
  let config = '# CCSH Configuration File\n';
  Object.entries(aliases).forEach(([name, command]) => {
    config += `alias ${name}='${command}'\n`;
  });
  fs.writeFileSync(configFile, config, 'utf8');
}

function addToHistory(command) {
  history.push(command);
  fs.appendFileSync(historyFile, command + '\n');
}

function loadHistory() {
  try {
    const fileContent = fs.readFileSync(historyFile, 'utf8');
    history.push(...fileContent.split('\n').filter(line => line.trim()));
  } catch (err) {
    console.log('No history file found. Creating a new one.');
  }
}

function showHistory() {
  history.forEach((command, index) => {
    console.log(`${index + 1}: ${command}`);
  });
}

function searchHistory(searchTerm) {
  const matches = history.filter(cmd => cmd.includes(searchTerm));
  matches.forEach((cmd, index) => {
    console.log(`${index + 1}: ${cmd}`);
  });
}

function tabCompletion(line) {
  const completions = [...Object.keys(aliases), 'cd', 'pwd', 'echo', 'exit', 'history', 'alias', 'unalias', 'jobs', 'fg', 'bg', 'source'];
  const hits = completions.filter(c => c.startsWith(line));
  return [hits.length ? hits : completions, line];
}

function expandVariables(arg) {
  return arg.replace(/\$(\w+)/g, (_, name) => process.env[name] || '');
}

function parseCommand(input) {
  const tokens = input.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) || [];
  const parsed = { command: '', args: [], input: null, output: null, append: false, background: false, pipe: [] };
  let current = parsed;

  tokens.forEach((token, index) => {
    token = token.replace(/^['"]|['"]$/g, '');
    if (token === '|' && index !== tokens.length - 1) {
      current.pipe.push({ command: '', args: [] });
      current = current.pipe[current.pipe.length - 1];
    } else if (token === '<') {
      current.input = tokens[++index].replace(/^['"]|['"]$/g, '');
    } else if (token === '>') {
      current.output = tokens[++index].replace(/^['"]|['"]$/g, '');
    } else if (token === '>>') {
      current.output = tokens[++index].replace(/^['"]|['"]$/g, '');
      current.append = true;
    } else if (token === '&' && index === tokens.length - 1) {
      parsed.background = true;
    } else if (!current.command) {
      current.command = token;
    } else {
      current.args.push(expandVariables(token));
    }
  });

  return parsed;
}

function executeCommand(parsedCommand) {
  if (parsedCommand.pipe.length > 0) {
    executePipeline(parsedCommand);
  } else {
    executeSingleCommand(parsedCommand);
  }
}

function executePipeline(parsedCommand) {
  const processes = [parsedCommand, ...parsedCommand.pipe].map((cmd, index, array) => {
    const stdio = ['pipe', 'pipe', 'pipe'];
    if (index === 0 && cmd.input) {
      stdio[0] = fs.openSync(cmd.input, 'r');
    }
    if (index === array.length - 1 && cmd.output) {
      stdio[1] = cmd.append ? fs.openSync(cmd.output, 'a') : fs.openSync(cmd.output, 'w');
    }
    return spawn(cmd.command, cmd.args, { stdio });
  });

  for (let i = 0; i < processes.length - 1; i++) {
    processes[i].stdout.pipe(processes[i + 1].stdin);
  }

  const lastProcess = processes[processes.length - 1];
  lastProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  lastProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  lastProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Pipeline exited with code ${code}`);
    }
    rl.prompt();
  });
}

function executeSingleCommand(parsedCommand) {
  if (executeBuiltIn(parsedCommand.command, parsedCommand.args)) {
    rl.prompt();
    return;
  }

  let inputFile, outputFile;

  try {
    if (parsedCommand.input) {
      inputFile = fs.openSync(parsedCommand.input, 'r');
    }
    if (parsedCommand.output) {
      outputFile = fs.openSync(parsedCommand.output, parsedCommand.append ? 'a' : 'w');
    }

    const childProcess = spawn(parsedCommand.command, parsedCommand.args, {
      stdio: [
        inputFile || 'inherit',
        outputFile || 'inherit',
        'inherit'
      ],
      shell: true
    });

    if (parsedCommand.background) {
      console.log(`[${jobs.length + 1}] ${childProcess.pid}`);
      jobs.push({ pid: childProcess.pid, command: parsedCommand.command, status: 'running' });
      childProcess.unref();
      rl.prompt();
    } else {
      childProcess.on('error', (error) => {
        console.error(`Error: ${error.message}`);
      });

      childProcess.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Command exited with code ${code}`);
        }
        if (inputFile) fs.closeSync(inputFile);
        if (outputFile) fs.closeSync(outputFile);
        rl.prompt();
      });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (inputFile) fs.closeSync(inputFile);
    if (outputFile) fs.closeSync(outputFile);
    rl.prompt();
  }
}

function executeBuiltIn(command, args) {
  switch (command) {
    case 'cd':
      const dir = args[0] || os.homedir();
      try {
        process.chdir(dir);
      } catch (err) {
        console.error(`cd: ${err.message}`);
      }
      break;
    case 'pwd':
      console.log(process.cwd());
      break;
    case 'echo':
      console.log(args.join(' '));
      break;
    case 'exit':
      saveConfig();
      rl.close();
      break;
    case 'history':
      if (args[0] === '-c') {
        history.length = 0;
        fs.writeFileSync(historyFile, '', 'utf8');
      } else if (args[0] === '-s') {
        searchHistory(args[1]);
      } else {
        showHistory();
      }
      break;
    case 'alias':
      if (args.length === 0) {
        Object.entries(aliases).forEach(([name, command]) => {
          console.log(`${name}='${command}'`);
        });
      } else {
        const [name, ...commandParts] = args;
        const command = commandParts.join(' ');
        aliases[name] = command;
        saveConfig();
      }
      break;
    case 'unalias':
      if (aliases[args[0]]) {
        delete aliases[args[0]];
        saveConfig();
      } else {
        console.error(`unalias: ${args[0]} not found`);
      }
      break;
    case 'jobs':
      jobs.forEach((job, index) => {
        console.log(`[${index + 1}] ${job.status} ${job.command} (${job.pid})`);
      });
      break;
    case 'fg':
      if (jobs.length > 0) {
        const job = jobs.pop();
        console.log(`${job.command} (${job.pid})`);
        process.kill(job.pid, 'SIGCONT');
      } else {
        console.error('No background jobs');
      }
      break;
    case 'bg':
      if (jobs.length > 0) {
        const job = jobs[jobs.length - 1];
        console.log(`[${jobs.length}] ${job.command} (${job.pid})`);
        process.kill(job.pid, 'SIGCONT');
        job.status = 'running';
      } else {
        console.error('No background jobs');
      }
      break;
    case 'source':
      if (args.length === 1) {
        executeScript(args[0]);
      } else {
        console.error('Usage: source <script_file>');
      }
      break;
    default:
      return false;
  }
  return true;
}

function executeScript(scriptPath) {
  try {
    const script = fs.readFileSync(scriptPath, 'utf8');
    const lines = script.split('\n');
    let i = 0;

    function executeLine() {
      if (i < lines.length) {
        const line = lines[i].trim();
        i++;

        if (line && !line.startsWith('#')) {
          if (line.startsWith('if') || line.startsWith('for') || line.startsWith('while')) {
            let block = [line];
            while (i < lines.length && !lines[i].trim().startsWith('fi') && !lines[i].trim().startsWith('done')) {
              block.push(lines[i].trim());
              i++;
            }
            block.push(lines[i].trim());
            i++;
            executeControlStructure(block);
          } else {
            const parsedCommand = parseCommand(line);
            executeCommand(parsedCommand);
          }
        } else {
          setImmediate(executeLine);
        }
      }
    }

    executeLine();
  } catch (err) {
    console.error(`Error executing script: ${err.message}`);
  }
}

function executeControlStructure(block) {
  const structureType = block[0].split(' ')[0];
  switch (structureType) {
    case 'if':
      const condition = block[0].split(' ').slice(1).join(' ');
      const result = spawn('test', [condition], { shell: true });
      result.on('exit', (code) => {
        if (code === 0) {
          for (let i = 1; i < block.length - 1; i++) {
            const parsedCommand = parseCommand(block[i]);
            executeCommand(parsedCommand);
          }
        }
      });
      break;
    case 'for':
    case 'while':
      console.error(`${structureType} loops are not implemented in this basic version`);
      break;
  }
}

function main() {
  loadConfig();
  loadHistory();

  rl.prompt();

  rl.on('line', (input) => {
    input = input.trim();
    if (input) {
      addToHistory(input);
      const parsedCommand = parseCommand(input);
      executeCommand(parsedCommand);
    } else {
      rl.prompt();
    }
  }).on('close', () => {
    console.log('Exiting ccsh');
    process.exit(0);
  });

  rl.on('SIGINT', () => {
    console.log('^C');
    rl.prompt();
  });
}

main();
