# Gitlab CLI Extension
Merging PR's and Cherry-picking merge commits is just a click away.

## Setting up the extension - server
1. `yarn build`
2. `cd dist/server`
3. `yarn start`

## Setting up the extension - client
1. go to `chrome://extensions`
2. turn on the `developer mode` toggle
3. `Load unpacked`
4. select `dist/extension`

### It's highly recommended that you DO NOT use your existing local repo but instead clone afresh at a different path and use that path in your `config.json`.
