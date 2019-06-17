/* Copyright 2019 Schibsted */

// See https://coderwall.com/p/yphywg/printing-colorful-text-in-terminal-when-run-node-js-script
let consoleColors = {
  reset: '\x1b[0m',
  fgYellow: '\x1b[33m',
  fgRed: '\x1b[31m',
  fgCyan: '\x1b[36m',
  dim: '\x1b[2m',
};

module.exports = {
  logWithColor,
  logYellow,
  logRed,
  logCyan,
  logDim,
  colors: consoleColors,
};

function logWithColor() {
  console.log(...arguments, consoleColors.reset);
}

function logRed() {
  logWithColor(consoleColors.fgRed, ...arguments);
}

function logCyan() {
  logWithColor(consoleColors.fgCyan, ...arguments);
}

function logDim() {
  logWithColor(consoleColors.dim, ...arguments);
}

function logYellow() {
  logWithColor(consoleColors.fgYellow, ...arguments);
}
