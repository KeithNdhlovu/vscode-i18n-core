import * as vscode from 'vscode'

import meta from '../meta'
import * as path from 'path'
import { i18nFile } from '../i18nFile'
import Config from '../Config'
import { StructureType } from '../i18nFile/I18nItem'

const toCamelCase = str => {
  return str.replace(/(-\w)/g, $1 => {
    return $1[1].toUpperCase()
  })
}

const onExtract = async ({
  filepath,
  text,
  keyReplace,
  promptText = `Please enter the path to save, for example: home.document.title`,
  keyTransform = key => key,
  defaultKeyTransform = key => key
}: {
  filepath: string
  text: string
  keyReplace: (key) => string
  promptText?: string
  keyTransform?: (key) => string
  defaultKeyTransform?: (key) => string
}) => {
  // Generate reference key
  let relativeName: any = path.relative(vscode.workspace.rootPath, filepath)
  relativeName = path.parse(relativeName)

  let defaultKey = relativeName.dir
    .split(path.sep)
    .splice(1)
    .concat(relativeName.name)
    .map(toCamelCase)

  if (defaultKey.length > 1) {
    defaultKey = defaultKey.splice(1)
  }

  defaultKey = `${defaultKey.join('.')}.${Math.random()
    .toString(36)
    .substr(-6)}`
  defaultKey = defaultKeyTransform(defaultKey)

  let key = await vscode.window.showInputBox({
    prompt: promptText,
    valueSelection: [defaultKey.lastIndexOf('.') + 1, defaultKey.length],
    value: defaultKey
  })

  if (!key) {
    return
  }

  key = keyTransform(key)

  const i18n = i18nFile.getFileByFilepath(filepath)

  if (i18n.structureType === StructureType.DIR && key.indexOf('.') === -1) {
    key = `common.${key}`
  }

  // Repeat detection
  const isOverride = await i18n.overrideCheck(key)
  if (!isOverride) {
    return
  }

  // Replace content
  vscode.window.activeTextEditor.edit(editBuilder => {
    const { start, end } = vscode.window.activeTextEditor.selection

    editBuilder.replace(new vscode.Range(start, end), keyReplace(key))
  })

  // Translate content
  let transData = i18n.getI18n(key)
  const mainTrans = transData.find(item => item.lng === Config.sourceLocale)

  mainTrans.text = text
  transData = await i18n.transI18n(transData)

  // write translation
  i18n.writeI18n(transData)
}

export const extract = () => {
  return vscode.commands.registerCommand(meta.COMMANDS.extract, onExtract)
}
