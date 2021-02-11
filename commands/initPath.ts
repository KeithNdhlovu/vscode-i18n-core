import * as vscode from 'vscode'
import * as fg from 'fast-glob'
import * as path from 'path'

import meta from '../meta'
import Config from '../Config'
import Log from '../Log'

class InitPath {
  async autoInit() {
    const rootPath = vscode.workspace.rootPath
    const pattern = [`${rootPath}/**/(locales|locale|i18n|lang|langs)`]
    const result: any[] = (
      await fg(pattern, {
        ignore: ['**/node_modules'],
        onlyDirectories: true
      })
    ).map((resultItem: string) => path.relative(rootPath, resultItem))

    Config.updateI18nPaths(result)

    const info = `${Config.extensionName}:🌟The following directories have been configured for you\n ${result.join(
      '\n'
    )}`

    vscode.window.showInformationMessage(info)
    Log.info(info)
  }

  async manualInit() {
    const okText = 'Configure now'
    const result = await vscode.window.showInformationMessage(
      `${Config.extensionName}: Where is the locales folder in the project?`,
      okText
    )

    if (result !== okText) {
      return
    }

    const dirs = await this.pickDir()
    Config.updateI18nPaths(dirs)

    this.success()
  }

  async pickDir(): Promise<string[]> {
    let dirs = await vscode.window.showOpenDialog({
      defaultUri: vscode.Uri.file(vscode.workspace.rootPath),
      canSelectFolders: true
    })

    return dirs.map(dirItem => dirItem.path)
  }

  async success() {
    const okText = 'Continue configuration'
    const result = await vscode.window.showInformationMessage(
      `${Config.extensionName}: Once configured, are there any other directories?`,
      okText,
      'No more'
    )

    if (result !== okText) {
      return
    }

    this.manualInit()
  }
}

const initPath = new InitPath()

export const autoInitCommand = () => {
  if (!Config.hasI18nPaths) {
    initPath.autoInit()
  }

  return vscode.commands.registerCommand(meta.COMMANDS.autoInitPath, () => {
    initPath.autoInit()
  })
}

export const manualInitCommand = () => {
  return vscode.commands.registerCommand(meta.COMMANDS.manualInitPath, () => {
    initPath.manualInit()
  })
}
