//---------//
// Imports //
//---------//

const path = require('node:path')
const pfs = require('node:fs/promises')
const chalk = require('chalk')
const { exec } = require('child-process-promise')
const { Spinner } = require('cli-spinner')

//
//------//
// Init //
//------//

const packageManager = getPackageManager(process.argv.slice(2)[0])
const devDependencies = getDevDependencies(packageManager)
const spinner = getSpinner(packageManager)
const cmd = `${packageManager} add -D ${devDependencies}`

//
//------//
// Main //
//------//

run()

async function run() {
  try {
    spinner.start()
    await exec(cmd)
    await writeConfigs()
    console.log('\n' + chalk.green('Done!'))
  } catch (err) {
    console.error('error installing\n', err)
  } finally {
    spinner.stop()
  }
}

//
//------------------//
// Helper Functions //
//------------------//

async function writeConfigs() {
  const [prettierCfg, eslintCfg, eslintCliCfg] = await Promise.all([
    read('prettier.config.mjs'),
    read('eslint.config.mjs'),
    read('eslint.cli.config.mjs'),
  ])
  await Promise.all([
    write('prettier.config.mjs', prettierCfg),
    write('eslint.config.mjs', eslintCfg),
    write('eslint.cli.config.mjs', eslintCliCfg),
  ])
}

function read(fname) {
  return pfs.readFile(path.resolve(import.meta.dirname, fname), 'utf8')
}

function write(fname, content) {
  return pfs.writeFile(`./${fname}`, content)
}

function getDevDependencies() {
  const personalConfig =
    packageManager === 'yarn'
      ? 'https://github.com/olsonpm/eslint-config-personal'
      : 'olsonpm/eslint-config-personal'
  return ['eslint', 'prettier', personalConfig].join(' ')
}

function getPackageManager(pmArg) {
  let packageManager = 'npm'
  if (pmArg === '--yarn') packageManager = 'yarn'
  else if (pmArg === '--pnpm') packageManager = 'pnpm'

  return packageManager
}

function getSpinner(packageManager) {
  const result = new Spinner(
    `%s Installing devDependencies using ${packageManager}`
  )

  // sets the animation number
  result.setSpinnerString(18)
  result.setSpinnerDelay(100)

  return result
}
