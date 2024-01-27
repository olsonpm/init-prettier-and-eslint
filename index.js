#! /usr/bin/env node

'use strict'

//---------//
// Imports //
//---------//

const pify = require('pify')

const chalk = require('chalk'),
  pFs = pify(require('fs')),
  resolveFrom = require('resolve-from')

const { exec } = require('child-process-promise'),
  { Spinner } = require('cli-spinner')

//
//------//
// Init //
//------//

const useYarn = process.argv.slice(2)[0] === '--yarn',
  devDependencies = getDevDependencies(),
  packageJsonFilePath = resolveFrom(process.cwd(), './package.json'),
  packageManager = useYarn ? 'yarn' : 'npm',
  spinner = new Spinner(`%s Installing devDependencies using ${packageManager}`)

// sets the animation number
spinner.setSpinnerString(18)
spinner.setSpinnerDelay(100)

//
//------//
// Main //
//------//

spinner.start()

const cmd = useYarn
  ? `yarn add -D ${devDependencies}`
  : `npm i --save-dev ${devDependencies}`

exec(cmd)
  .then(() => {
    return readFile(packageJsonFilePath)
  })
  .then(
    flow([
      parseJson,
      mergeEslintAndPrettierSettings,
      jsonStringify,
      writeToFile(packageJsonFilePath),
    ])
  )
  .catch(err => console.error(err)) // eslint-disable-line no-console
  .then(() => {
    spinner.stop()
    console.log('\n' + chalk.green('Done!')) // eslint-disable-line no-console
  })

//
//------------------//
// Helper Functions //
//------------------//

function jsonStringify(obj) {
  return JSON.stringify(obj, null, 2)
}

function parseJson(str) {
  return JSON.parse(str)
}

function mergeEslintAndPrettierSettings(pjson) {
  return Object.assign(pjson, {
    eslintConfig: {
      extends: '@olsonpm/eslint-config-personal',
    },
    prettier: {
      arrowParens: 'avoid',
      semi: false,
      singleQuote: true,
      trailingComma: 'es5',
    },
  })
}

function flow(functionArray) {
  return arg => functionArray.reduce((res, fn) => fn(res), arg)
}

function readFile(fpath) {
  return pFs.readFile(fpath, 'utf8')
}

function writeToFile(fpath) {
  return contents => pFs.writeFile(fpath, contents)
}

function getDevDependencies() {
  const personalConfig = useYarn
    ? 'https://github.com/olsonpm/eslint-config-personal'
    : 'olsonpm/eslint-config-personal'
  return ['eslint', 'prettier', 'prettier-eslint', personalConfig].join(' ')
}
