# run this to compress all js and js modules into one file so github pages can use it all

import os
from jsmin import jsmin

# reformats a javascript file removing modular syntax, some comments, and use-strict
def formatFile(fileName):
  file = open(fileName, 'r')
  lines = file.readlines()
  outLines = ''
  for line in lines:
    outLine = line
    words = line.strip().split(' ', 1)
    if words[0] in ['\n', 'import', '\'use-strict\';'] or words[0].find('//') == 0 or line == '\n':
      continue
    if words[0] == 'export':
      outLine = words[1]
      words = words[1].split(' ', 1)
      if words[0] == 'default':
        outLine = words[1]
    outLines += outLine

  return '\n' + ''.join(outLines)

MODULES_DIR = '../modules'
main = '\'use strict\';'
for fileName in os.listdir(MODULES_DIR):
  if fileName != 'main.js':
    main += formatFile(MODULES_DIR + '/' + fileName)
main += formatFile(MODULES_DIR + '/main.js')

main = jsmin(main)
main = "// Check out the uncondensed and commented version here: https://github.com/ARognes/AlgoGrid/tree/master/modules \n" + main

out = open('../main.js', 'w')
out.write(main)
print("Done")