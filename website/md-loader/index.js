/* eslint-disable @typescript-eslint/no-var-requires */
const {
  stripScript,
  stripTemplate,
  genInlineComponentText,
} = require('./util')
const md = require('./config')

module.exports = function(source) {
  const content = md.render(source)

  const startTag = '<!--element-demo:'
  const startTagLen = startTag.length
  const endTag = ':element-demo-->'
  const endTagLen = endTag.length

  let componentsString = ''
  let id = 0 // demo 的 id
  let output = [] // 输出的内容
  let start = 0 // 字符串开始位置

  let commentStart = content.indexOf(startTag)
  let commentEnd = content.indexOf(endTag, commentStart + startTagLen)
  while (commentStart !== -1 && commentEnd !== -1) {
    output.push(content.slice(start, commentStart))

    const commentContent = content.slice(commentStart + startTagLen, commentEnd)
    const html = stripTemplate(commentContent)
    const script = stripScript(commentContent)
    let demoComponentContent = genInlineComponentText(html, script)
    const demoComponentName = `element-demo${id}`
    output.push(`<template #source><${demoComponentName} /></template>`)
    componentsString += `${JSON.stringify(demoComponentName)}: ${demoComponentContent},`

    // 重新计算下一次的位置
    id++
    start = commentEnd + endTagLen
    commentStart = content.indexOf(startTag, start)
    commentEnd = content.indexOf(endTag, commentStart + startTagLen)
  }

  // 仅允许在 demo 不存在时，才可以在 Markdown 中写 script 标签
  // todo: 优化这段逻辑

  let pageScript = ''
  if (componentsString) {
    pageScript = `<script lang="ts">
      import * as Vue from 'vue';
      export default {
        name: 'component-doc',
        components: {
          ${componentsString}
        }
      }
    </script>`
  } else if (content.indexOf('<script>') === 0) { // 硬编码，有待改善
    start = content.indexOf('</script>') + '</script>'.length
    pageScript = content.slice(0, start)
  }

  output.push(content.slice(start))
  const result = `
  <template>
    <section class="content element-doc">
      ${output.join('')}
      <right-nav />
    </section>
  </template>
  ${pageScript}
  `
  return result
}
