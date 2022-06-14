#!/usr/bin/env node
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { createApp } = require('./createApp');
const { questions } = require('./questions');
const { verifyNodeVersion, getAppName } = require('./utils');
const { resolveLanguage, resolveStyledLib, resolveTemplate } = require('./config');

const handleExit = () => {
  console.log('Exiting without error.');
  process.exit();
};

const handleError = (e) => {
  console.error('ERROR! An error was encountered while executing');
  console.error(e);
  console.log('Exiting with error.');
  process.exit(1);
};

// verify node version
verifyNodeVersion();

process.on('SIGINT', handleExit);
process.on('uncaughtException', handleError);

console.log();
console.log('-------------------------------------------------------');
console.log('Assuming you have already run `npm install` to update the deps.');
console.log('If not, remember to do this before testing!');
console.log('-------------------------------------------------------');
console.log();

// Temporarily overwrite package.json of all packages in monorepo
// to point to each other using absolute file:/ URLs.

// const gitStatus = cp.execSync(`git status --porcelain`).toString();

// if (gitStatus.trim() !== '') {
//   console.log('Please commit your changes before running this script!');
//   console.log('Exiting because `git status` is not empty:');
//   console.log();
//   console.log(gitStatus);
//   console.log();
//   process.exit(1);
// }

const rootDir = __dirname;
const packagesDir = path.join(rootDir, 'templates');
const packagePathsByName = {};

// get cra, nextjs, vitejs
fs.readdirSync(packagesDir).forEach((name) => {
  if (name && name !== '.DS_Store') {
    // get locations for cra, nextjs, vitejs
    const templateDir = path.join(packagesDir, name);

    // get directories javascript and typescript
    fs.readdirSync(templateDir).forEach((template) => {
      const packageDir = path.join(templateDir, template);
      const packageJson = path.join(packageDir, 'package.json');
      if (fs.existsSync(packageJson)) {
        packagePathsByName[`${name}-${template}`] = packageDir;
      }
    });
  }
});

Object.keys(packagePathsByName).forEach((name) => {
  const packageJson = path.join(packagePathsByName[name], 'package.json');
  const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  Object.keys(packagePathsByName).forEach((otherName) => {
    if (json.dependencies && json.dependencies[otherName]) {
      json.dependencies[otherName] = 'file:' + packagePathsByName[otherName];
    }
    if (json.devDependencies && json.devDependencies[otherName]) {
      json.devDependencies[otherName] = 'file:' + packagePathsByName[otherName];
    }
    if (json.peerDependencies && json.peerDependencies[otherName]) {
      json.peerDependencies[otherName] =
        'file:' + packagePathsByName[otherName];
    }
    if (json.optionalDependencies && json.optionalDependencies[otherName]) {
      json.optionalDependencies[otherName] =
        'file:' + packagePathsByName[otherName];
    }
  });

  fs.writeFileSync(packageJson, JSON.stringify(json, null, 2), 'utf8');
  console.log(
    'Replaced local dependencies in packages/' + name + '/package.json'
  );
});
console.log('Replaced all local dependencies for testing.');
console.log('Do not edit any package.json while this task is running.');

const [_name, _template, _language, _styledLib] = process.argv.slice(2);

let appName = getAppName(_name);
let template = resolveTemplate[_template];
let language = resolveLanguage[_language];
let styledLib = resolveStyledLib[_styledLib];

if (appName && template && language && styledLib) {
  createApp({ appName, template, language, styledLib });
}

if (appName && template && language) {
  inquirer.prompt([questions.styledLib]).then(({ styledInput }) => {
    styledLib = styledInput;
    createApp({ appName, template, language, styledLib });
  });
}

if (appName && template) {
  inquirer
    .prompt([questions.language, questions.styledLib])
    .then(({ languageInput, styledInput }) => {
      language = languageInput;
      styledLib = styledInput;
      createApp({ appName, template, language, styledLib });
    });
}

if (appName) {
  inquirer
    .prompt([questions.template, questions.language, questions.styledLib])
    .then(({ languageInput, templateInput, styledInput }) => {
      template = templateInput;
      language = languageInput;
      styledLib = styledInput;
      createApp({ appName, template, language, styledLib });
    });
}

inquirer
  .prompt([
    questions.appName,
    questions.template,
    questions.language,
    questions.styled
  ])
  .then(({ templateInput, appNameInput, languageInput, styledInput }) => {
    appName = getAppName(appNameInput);
    template = templateInput;
    language = languageInput;
    styledLib = styledInput;

    createApp({ appName, template, language, styledLib });
  });
