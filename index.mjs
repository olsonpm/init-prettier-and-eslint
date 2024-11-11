//---------//
// Imports //
//---------//

import path from 'node:path'
import pfs from 'node:fs/promises'
import { execute } from 'async-execute'
import { green, red } from 'tiny-chalk'
import yoctoSpinner from 'yocto-spinner'

//
//------//
// Init //
//------//

const packageManager = getPackageManager(process.argv.slice(2)[0])
const devDependencies = getDevDependencies(packageManager)
const spinner = yoctoSpinner({
  text: `Installing devDependencies using ${packageManager}`,
})
const cmd = `${packageManager} add -D ${devDependencies}`

//
//------//
// Main //
//------//

run()

async function run() {
  try {
    spinner.start()
    await execute(cmd)
    await writeConfigs()
    spinner.stop(green('Done !'))
  } catch (err) {
    console.error(red('error installing\n'), err)
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
